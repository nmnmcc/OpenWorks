import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, sql } from "drizzle-orm";
import {
  Api,
  Comment,
  CommentNotFound,
  CommentForbidden,
  CommentTargetNotFound,
  PostLocked,
  CurrentUser,
} from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { comments, posts, notifications, modLog } from "../../database/schema";

export const CommentsHandlers = HttpApiBuilder.group(
  Api,
  "comments",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.comments.findMany({
            where: {
              postId: query.postId,
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
            orderBy: { createdAt: "asc" },
          });
          return rows.map((row) => new Comment(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const row = yield* database.query.comments.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new CommentNotFound();
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

          if (post.groupId) {
            yield* authorization.check(user.id, post.groupId, {
              action: "create",
              subject: "Comment",
            });
            const mute = yield* database.query.groupMutes.findFirst({
              where: {
                groupId: post.groupId,
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
              groupId: post.groupId,
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

          if (existing.groupId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.groupId, {
                action: "update",
                subject: "Comment",
              });
            } else {
              yield* authorization.check(user.id, existing.groupId, {
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

          if (existing.groupId) {
            if (existing.authorId === user.id) {
              yield* authorization.check(user.id, existing.groupId, {
                action: "delete",
                subject: "Comment",
              });
            } else {
              yield* authorization.check(user.id, existing.groupId, {
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
          if (!existing.groupId) {
            return yield* new CommentForbidden();
          }
          yield* authorization.check(user.id, existing.groupId, {
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
            groupId: existing.groupId,
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
