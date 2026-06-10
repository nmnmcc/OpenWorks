import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import {
  Api,
  Post,
  PostSearchResult,
  PostNotFound,
  PostForbidden,
  PostGroupNotFound,
  InvalidPoll,
  InvalidFlair,
  CurrentUser,
} from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { posts, polls, pollOptions, modLog } from "../../database/schema";
import { Search } from "../../search";
import { portableTextToPlainText } from "../../../libraries/portable-text";

export const PostsHandlers = HttpApiBuilder.group(
  Api,
  "posts",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const search = yield* Search;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const sort = query.sort ?? "hot";
          const limit = Math.min(query.limit ?? 25, 100);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.posts.findMany({
            where: {
              removed: false,
              groupId: query.groupId,
              group: query.feed === "home" ? { members: { userId: user.id } } : undefined,
              OR: [
                { groupId: { isNull: true } },
                {
                  group: {
                    visibility: { ne: "private" },
                  },
                },
                { group: { members: { userId: user.id } } },
              ],
            },
            orderBy:
              sort === "new"
                ? (table, { desc }) => [desc(table.pinned), desc(table.createdAt)]
                : sort === "top"
                  ? (table, { desc }) => [desc(table.pinned), desc(table.score), desc(table.createdAt)]
                  : (table, { desc, sql }) => [
                      desc(table.pinned),
                      desc(
                        sql`log(greatest(abs(${table.score}), 1)) * sign(${table.score}) + extract(epoch from ${table.createdAt}) / 45000`,
                      ),
                    ],
            limit,
            offset,
          });
          return rows.map((row) => new Post(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = query.limit ?? 20;
          const offset = query.offset ?? 0;

          const result = yield* Effect.tryPromise(() =>
            search.index("posts").search(query.q, {
              filter: query.groupId ? `groupId = "${query.groupId}"` : undefined,
              sort: ["createdAt:desc"],
              limit,
              offset,
            }),
          );

          const ids = result.hits.map((hit) => hit["id"] as string);

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
              OR: [
                { groupId: { isNull: true } },
                {
                  group: {
                    visibility: { ne: "private" },
                  },
                },
                { group: { members: { userId: user.id } } },
              ],
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
          const user = yield* CurrentUser;
          const row = yield* database.query.posts.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new PostNotFound();
          }
          if (row.groupId) {
            const group = yield* database.query.groups.findFirst({
              where: { id: row.groupId },
            });
            if (group && group.visibility === "private") {
              const membership = yield* database.query.groupMembers.findFirst({
                where: {
                  groupId: group.id,
                  userId: user.id,
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

          if (payload.groupId) {
            const group = yield* database.query.groups.findFirst({
              where: { id: payload.groupId },
            });
            if (!group) {
              return yield* new PostGroupNotFound();
            }
            if (group.postingRestriction === "moderator") {
              yield* authorization.check(user.id, payload.groupId, {
                action: "manage",
                subject: "Post",
              });
            } else if (group.postingRestriction === "admin") {
              yield* authorization.check(user.id, payload.groupId, {
                action: "manage",
                subject: "Group",
              });
            } else {
              yield* authorization.check(user.id, payload.groupId, {
                action: "create",
                subject: "Post",
              });
            }
            const mute = yield* database.query.groupMutes.findFirst({
              where: {
                groupId: payload.groupId,
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
            if (!flair || !payload.groupId || flair.groupId !== payload.groupId) {
              return yield* new InvalidFlair();
            }
          }

          const id = v7();
          const postType = payload.type ?? "text";

          if (postType === "poll" && (!payload.pollOptions || payload.pollOptions.length < 2)) {
            return yield* new InvalidPoll();
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
              groupId: payload.groupId,
              flairId: payload.flairId,
              nsfw: payload.nsfw ?? false,
              spoiler: payload.spoiler ?? false,
            })
            .returning();

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

          const content = row!.content ? portableTextToPlainText(row!.content) : "";

          yield* Effect.tryPromise(() =>
            search.index("posts").addDocuments([
              {
                id: row!.id,
                title: row!.title,
                content,
                authorId: row!.authorId,
                groupId: row!.groupId,
                createdAt: row!.createdAt.toISOString(),
              },
            ]),
          ).pipe(Effect.ignore);

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

          if (existing.groupId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.groupId, {
                action: "update",
                subject: "Post",
              });
            } else {
              yield* authorization.check(user.id, existing.groupId, {
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
            if (!flair || flair.groupId !== existing.groupId) {
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

          const content = row!.content ? portableTextToPlainText(row!.content) : "";

          yield* Effect.tryPromise(() =>
            search.index("posts").addDocuments([
              {
                id: row!.id,
                title: row!.title,
                content,
                authorId: row!.authorId,
                groupId: row!.groupId,
                createdAt: row!.createdAt.toISOString(),
              },
            ]),
          ).pipe(Effect.ignore);

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
          if (!existing.groupId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ pinned: true }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: existing.groupId,
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
          if (!existing.groupId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ pinned: false }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: existing.groupId,
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
          if (!existing.groupId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ locked: true }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: existing.groupId,
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
          if (!existing.groupId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "Post",
          });
          const [row] = yield* database.update(posts).set({ locked: false }).where(eq(posts.id, params.id)).returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: existing.groupId,
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
          if (!existing.groupId) {
            return yield* new PostForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
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
            groupId: existing.groupId,
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

          if (existing.groupId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.groupId, {
                action: "delete",
                subject: "Post",
              });
            } else {
              yield* authorization.check(user.id, existing.groupId, {
                action: "manage",
                subject: "Post",
              });
            }
          } else if (existing.authorId !== user.id) {
            return yield* new PostForbidden();
          }

          yield* database.delete(posts).where(eq(posts.id, params.id));

          yield* Effect.tryPromise(() => search.index("posts").deleteDocument(params.id)).pipe(Effect.ignore);
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
