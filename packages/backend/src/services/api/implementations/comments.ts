import { eq, sql } from "drizzle-orm";
import { Effect, Option } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { comments } from "../../database/schema/comment";
import { modLog } from "../../database/schema/moderation-log";
import { notifications } from "../../database/schema/notification";
import { posts } from "../../database/schema/post";
import { Search } from "../../search";
import { Api } from "../interfaces";
import {
  Comment,
  CommentForbidden,
  CommentNotFound,
  CommentSearchResult,
  CommentTargetNotFound,
  PostLocked,
} from "../interfaces/comments";
import { CurrentUser, CurrentUserOption } from "../interfaces/middlewares/auth";

/** 可见评论的空间过滤：无空间、公开空间，以及（已登录时）自己加入的空间。 */
const visibleSpaceFilters = (userId: string | undefined) =>
  userId === undefined
    ? [{ spaceId: { isNull: true as const } }, { space: { visibility: { ne: "private" as const } } }]
    : [
        { spaceId: { isNull: true as const } },
        { space: { visibility: { ne: "private" as const } } },
        { space: { members: { userId } } },
      ];

export const CommentsHandlers = HttpApiBuilder.group(
  Api,
  "comments",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const authorization = yield* Authorization;
    const search = yield* Search;

    return handlers
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchComments({
            q: query.q,
            postId: query.postId,
            spaceId: query.spaceId,
            limit,
            offset,
          });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new CommentSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.comments.findMany({
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
            .map((row) => new Comment(row));

          return new CommentSearchResult({
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
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const rows = yield* database.query.comments.findMany({
            where: {
              postId: query.postId,
              OR: visibleSpaceFilters(userId),
            },
            orderBy: { createdAt: "asc" },
          });
          return rows.map((row) => new Comment(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const row = yield* database.query.comments.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new CommentNotFound();
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
                return yield* new CommentNotFound();
              }
            }
          }
          return new Comment(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          const post = yield* database.query.posts.findFirst({
            where: { id: payload.postId },
          });
          if (!post || post.removed) {
            return yield* new CommentTargetNotFound();
          }
          if (post.locked) {
            return yield* new PostLocked();
          }

          const parent = payload.parentId
            ? yield* database.query.comments.findFirst({
                where: { id: payload.parentId },
              })
            : undefined;

          if (payload.parentId && (!parent || parent.postId !== payload.postId)) {
            return yield* new CommentTargetNotFound();
          }

          if (post.spaceId) {
            yield* authorization.check(user.id, post.spaceId, {
              action: "create",
              subject: "Comment",
            });
            const mute = yield* database.query.spaceMutes.findFirst({
              where: {
                spaceId: post.spaceId,
                userId: user.id,
              },
            });
            if (mute && (!mute.expiresAt || mute.expiresAt > new Date())) {
              return yield* new CommentForbidden();
            }
          }

          const [row] = yield* database
            .insert(comments)
            .values({
              id: v7(),
              content: payload.content,
              authorId: user.id,
              postId: payload.postId,
              parentId: payload.parentId,
              spaceId: post.spaceId,
            })
            .returning();

          yield* database
            .update(posts)
            .set({
              commentCount: sql`${posts.commentCount} + 1`,
            })
            .where(eq(posts.id, payload.postId));

          const notifyUserId = parent ? parent.authorId : post.authorId;
          if (notifyUserId !== user.id) {
            yield* database.insert(notifications).values({
              id: v7(),
              userId: notifyUserId,
              type: parent ? "comment_reply" : "post_reply",
              title: parent ? "你的评论收到了新回复" : "你的帖子收到了新评论",
              body: post.title,
              linkUrl: `/posts/${post.id}`,
            });
          }

          return new Comment(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new CommentForbidden()),
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
          const existing = yield* database.query.comments.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new CommentNotFound();
          }

          if (existing.spaceId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "update",
                subject: "Comment",
              });
            } else {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "manage",
                subject: "Comment",
              });
            }
          } else if (existing.authorId !== user.id) {
            return yield* new CommentForbidden();
          }

          const [row] = yield* database
            .update(comments)
            .set({ content: payload.content })
            .where(eq(comments.id, params.id))
            .returning();

          return new Comment(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new CommentForbidden()),
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
          const existing = yield* database.query.comments.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new CommentNotFound();
          }

          if (existing.spaceId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "delete",
                subject: "Comment",
              });
            } else {
              yield* authorization.check(user.id, existing.spaceId, {
                action: "manage",
                subject: "Comment",
              });
            }
          } else if (existing.authorId !== user.id) {
            return yield* new CommentForbidden();
          }

          const siblings = yield* database.query.comments.findMany({
            where: { postId: existing.postId },
            columns: { id: true, parentId: true },
          });
          const childrenByParent = Map.groupBy(
            siblings.filter((s) => s.parentId !== null),
            (s) => s.parentId!,
          );
          const countSubtree = (id: string): number =>
            1 + (childrenByParent.get(id) ?? []).reduce((sum, child) => sum + countSubtree(child.id), 0);
          const subtreeSize = countSubtree(existing.id);

          yield* database.delete(comments).where(eq(comments.id, params.id));

          yield* database
            .update(posts)
            .set({
              commentCount: sql`greatest(${posts.commentCount} - ${subtreeSize}, 0)`,
            })
            .where(eq(posts.id, existing.postId));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new CommentForbidden()),
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
          const existing = yield* database.query.comments.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new CommentNotFound();
          }
          if (!existing.spaceId) {
            return yield* new CommentForbidden();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "Comment",
          });
          const [row] = yield* database
            .update(comments)
            .set({
              removed: true,
              removedById: user.id,
              removedReason: payload.reason,
            })
            .where(eq(comments.id, params.id))
            .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: existing.spaceId,
            moderatorId: user.id,
            action: "comment_remove",
            targetType: "comment",
            targetId: params.id,
            details: { reason: payload.reason ?? null },
          });
          return new Comment(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new CommentForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
