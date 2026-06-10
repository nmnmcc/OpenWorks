import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, and } from "drizzle-orm";
import { Api, SavedItemEntry, SavedConflict, SavedTargetNotFound, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { savedItems } from "../../database/schema";

export const SavedHandlers = HttpApiBuilder.group(
  Api,
  "saved",
  Effect.fn(function* (handlers) {
    const database = yield* Database;

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.savedItems.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
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
      .handle("unsave", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* database
            .delete(savedItems)
            .where(and(eq(savedItems.id, params.id), eq(savedItems.userId, user.id)));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
