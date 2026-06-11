import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { savedItems } from "../../database/schema/saved-item";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { SavedConflict, SavedItemEntry, SavedTargetNotFound } from "../interfaces/saved";

export const SavedHandlers = HttpApiBuilder.group(
  Api,
  "saved",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.savedItems.findMany({
            where: {
              userId: user.id,
              postId: query.postId,
              commentId: query.commentId,
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new SavedItemEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("save", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          if (payload.postId) {
            const post = yield* database.query.posts.findFirst({
              where: { id: payload.postId },
            });
            if (!post) {
              return yield* new SavedTargetNotFound();
            }
            const existing = yield* database.query.savedItems.findFirst({
              where: {
                userId: user.id,
                postId: payload.postId,
              },
            });
            if (existing) {
              return yield* new SavedConflict();
            }
          } else if (payload.commentId) {
            const comment = yield* database.query.comments.findFirst({
              where: { id: payload.commentId },
            });
            if (!comment) {
              return yield* new SavedTargetNotFound();
            }
            const existing = yield* database.query.savedItems.findFirst({
              where: {
                userId: user.id,
                commentId: payload.commentId,
              },
            });
            if (existing) {
              return yield* new SavedConflict();
            }
          } else {
            return yield* new SavedTargetNotFound();
          }
          const [row] = yield* database
            .insert(savedItems)
            .values({
              id: v7(),
              userId: user.id,
              postId: payload.postId,
              commentId: payload.commentId,
            })
            .returning();
          return new SavedItemEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("unsave", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          if (query.postId !== undefined) {
            yield* database
              .delete(savedItems)
              .where(and(eq(savedItems.userId, user.id), eq(savedItems.postId, query.postId)));
          } else if (query.commentId !== undefined) {
            yield* database
              .delete(savedItems)
              .where(and(eq(savedItems.userId, user.id), eq(savedItems.commentId, query.commentId)));
          }
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
