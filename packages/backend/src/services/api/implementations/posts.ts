import { eq, sql } from "drizzle-orm";
import { Effect, Match, Option } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { modLog } from "../../database/schema/moderation-log";
import { notifications } from "../../database/schema/notification";
import { pollOptions, polls } from "../../database/schema/poll";
import { posts } from "../../database/schema/post";
import { works } from "../../database/schema/work";
import { Search } from "../../search";
import { Api } from "../interfaces";
import { CurrentUser, CurrentUserOption } from "../interfaces/middlewares/auth";
import {
  InvalidFlair,
  InvalidPoll,
  Post,
  PostForbidden,
  PostNotFound,
  PostSearchResult,
  PostSpaceNotFound,
  PostWorkNotFound,
  ReviewConflict,
} from "../interfaces/posts";

/** 可见帖子的空间过滤：无空间、公开空间，以及（已登录时）自己加入的空间。 */
const visibleSpaceFilters = (userId: string | undefined) =>
  userId === undefined
    ? [{ spaceId: { isNull: true as const } }, { space: { visibility: { ne: "private" as const } } }]
    : [
        { spaceId: { isNull: true as const } },
        { space: { visibility: { ne: "private" as const } } },
        { space: { members: { userId } } },
      ];

export const PostsHandlers = HttpApiBuilder.group(
  Api,
  "posts",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const search = yield* Search;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const sort = query.sort ?? "hot";
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.posts.findMany({
            where: {
              removed: false,
              spaceId: query.spaceId,
              workId: query.workId,
              authorId: query.authorId,
              type: query.kind === "review" ? "review" : query.kind === "discussion" ? { ne: "review" } : undefined,
              space: query.feed === "home" && userId !== undefined ? { members: { userId } } : undefined,
              NOT: userId === undefined ? undefined : { hiddenPosts: { userId } },
              OR: visibleSpaceFilters(userId),
            },
            orderBy: (table, { desc, sql }) =>
              Match.value(sort).pipe(
                Match.when("new", () => [desc(table.pinned), desc(table.createdAt)]),
                Match.when("top", () => [desc(table.pinned), desc(table.score), desc(table.createdAt)]),
                Match.orElse(() => [
                  desc(table.pinned),
                  desc(
                    sql`log(greatest(abs(${table.score}), 1)) * sign(${table.score}) + extract(epoch from ${table.createdAt}) / ${config.hotScoring.decayDivisor}`,
                  ),
                ]),
              ),
            limit,
            offset,
          });
          return rows.map((row) => new Post(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchPosts({ q: query.q, spaceId: query.spaceId, limit, offset });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new PostSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.posts.findMany({
            where: {
              id: { in: ids },
              removed: false,
              OR: visibleSpaceFilters(userId),
            },
          });

          const rowMap = new Map(rows.map((row) => [row.id, row]));
          const hits = ids
            .map((id) => rowMap.get(id))
            .filter((row): row is (typeof rows)[number] => row !== undefined)
            .map((row) => new Post(row));

          return new PostSearchResult({
            hits,
            query: result.query,
            estimatedTotalHits: result.estimatedTotalHits ?? 0,
            processingTimeMs: result.processingTimeMs,
            limit,
            offset,
          });
        }).pipe(
          Effect.catchTag("UnknownError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const row = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new PostNotFound();
          }
          if (row.spaceId) {
            const space = yield* database.query.spaces.findFirst({
              where: { id: row.spaceId },
            });
            if (space && space.visibility === "private") {
              const membership =
                userId === undefined
                  ? undefined
                  : yield* database.query.spaceMembers.findFirst({
                      where: {
                        spaceId: space.id,
                        userId,
                      },
                    });
              if (!membership) {
                return yield* new PostNotFound();
              }
            }
          }
          return new Post(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          if (payload.spaceId) {
            const space = yield* database.query.spaces.findFirst({
              where: { id: payload.spaceId },
            });
            if (!space) {
              return yield* new PostSpaceNotFound();
            }
            if (space.postingRestriction === "moderator") {
              yield* authorization.check(user.id, payload.spaceId, {
                action: "manage",
                subject: "Post",
              });
            } else if (space.postingRestriction === "admin") {
              yield* authorization.check(user.id, payload.spaceId, {
                action: "manage",
                subject: "Space",
              });
            } else {
              yield* authorization.check(user.id, payload.spaceId, {
                action: "create",
                subject: "Post",
              });
            }
            const mute = yield* database.query.spaceMutes.findFirst({
              where: {
                spaceId: payload.spaceId,
                userId: user.id,
              },
            });
            if (mute && (!mute.expiresAt || mute.expiresAt > new Date())) {
              return yield* new PostForbidden();
            }
          }

          if (payload.flairId) {
            const flair = yield* database.query.postFlairs.findFirst({
              where: { id: payload.flairId },
            });
            if (!flair || !payload.spaceId || flair.spaceId !== payload.spaceId) {
              return yield* new InvalidFlair();
            }
          }

          const id = v7();
          const postType = payload.type ?? "text";

          if (postType === "poll" && (!payload.pollOptions || payload.pollOptions.length < 2)) {
            return yield* new InvalidPoll();
          }

          if (postType === "review") {
            if (!payload.workId) {
              return yield* new PostWorkNotFound();
            }
            const work = yield* database.query.works.findFirst({
              where: { id: payload.workId },
            });
            if (!work) {
              return yield* new PostWorkNotFound();
            }
            const existingReview = yield* database.query.posts.findFirst({
              where: { authorId: user.id, workId: payload.workId, type: "review" },
            });
            if (existingReview) {
              return yield* new ReviewConflict();
            }
          }

          if (payload.workId && postType !== "review") {
            const work = yield* database.query.works.findFirst({
              where: { id: payload.workId },
            });
            if (!work) {
              return yield* new PostWorkNotFound();
            }
          }

          const [row] = yield* database
            .insert(posts)
            .values({
              id,
              title: payload.title,
              type: postType,
              content: payload.content,
              url: payload.url,
              authorId: user.id,
              spaceId: payload.spaceId,
              flairId: payload.flairId,
              workId: payload.workId,
              nsfw: payload.nsfw ?? false,
              spoiler: payload.spoiler ?? false,
            })
            .returning();

          if (postType === "review" && payload.workId) {
            yield* database
              .update(works)
              .set({ reviewCount: sql`${works.reviewCount} + 1` })
              .where(eq(works.id, payload.workId));
            const work = yield* database.query.works.findFirst({
              where: { id: payload.workId },
            });
            if (work && work.createdById && work.createdById !== user.id) {
              yield* database.insert(notifications).values({
                id: v7(),
                userId: work.createdById,
                type: "work_review",
                title: `New review on "${work.title}"`,
                body: payload.title,
                linkUrl: `/library/works/${work.id}`,
              });
            }
          }

          if (postType === "poll" && payload.pollOptions) {
            const pollId = v7();
            yield* database.insert(polls).values({
              id: pollId,
              postId: id,
              votingEndsAt: payload.pollEndsAt,
            });
            yield* database.insert(pollOptions).values(
              payload.pollOptions.map((text, idx) => ({
                id: v7(),
                pollId,
                text,
                position: idx,
              })),
            );
          }

          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }

          if (existing.spaceId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "update",
                subject: "Post",
              });
            } else {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "manage",
                subject: "Post",
              });
            }
          } else if (existing.authorId !== user.id) {
            return yield* new PostForbidden();
          }

          if (payload.flairId) {
            const flair = yield* database.query.postFlairs.findFirst({
              where: { id: payload.flairId },
            });
            if (!flair || flair.spaceId !== existing.spaceId) {
              return yield* new InvalidFlair();
            }
          }

          const [row] = yield* database
            .update(posts)
            .set({
              title: payload.title,
              content: payload.content,
              url: payload.url,
              flairId: payload.flairId,
              nsfw: payload.nsfw,
              spoiler: payload.spoiler,
            })
            .where(eq(posts.id, params.id))
            .returning();

          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("pin", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }
          if (!existing.spaceId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ pinned: true }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "post_pin",
            targetType: "post",
            targetId: params.id,
          });
          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("unpin", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }
          if (!existing.spaceId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ pinned: false }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "post_unpin",
            targetType: "post",
            targetId: params.id,
          });
          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("lock", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }
          if (!existing.spaceId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ locked: true }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "post_lock",
            targetType: "post",
            targetId: params.id,
          });
          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("unlock", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }
          if (!existing.spaceId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ locked: false }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "post_unlock",
            targetType: "post",
            targetId: params.id,
          });
          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("remove", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }
          if (!existing.spaceId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database
            .update(posts)
            .set({
              removed: true,
              removedById: user.id,
              removedReason: payload.reason,
            })
            .where(eq(posts.id, params.id))
            .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "post_remove",
            targetType: "post",
            targetId: params.id,
            details: { reason: payload.reason ?? null },
          });
          return new Post(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new PostNotFound();
          }

          if (existing.spaceId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "delete",
                subject: "Post",
              });
            } else {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "manage",
                subject: "Post",
              });
            }
          } else if (existing.authorId !== user.id) {
            return yield* new PostForbidden();
          }

          if (existing.type === "review" && existing.workId) {
            yield* database
              .update(works)
              .set({ reviewCount: sql`greatest(${works.reviewCount} - 1, 0)` })
              .where(eq(works.id, existing.workId));
          }

          yield* database.delete(posts).where(eq(posts.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new PostForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
