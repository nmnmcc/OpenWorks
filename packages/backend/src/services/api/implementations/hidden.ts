import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, and } from "drizzle-orm";
import { Api, HiddenPostEntry, HiddenTargetNotFound, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { hiddenPosts } from "../../database/schema";

export const HiddenHandlers = HttpApiBuilder.group(
  Api,
  "hidden",
  Effect.fn(function* (handlers) {
    const database = yield* Database;

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.hiddenPosts.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new HiddenPostEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("hide", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const post = yield* database.query.posts.findFirst({
            where: { id: payload.postId },
          });
          if (!post) {
            return yield* new HiddenTargetNotFound();
          }
          const existing = yield* database.query.hiddenPosts.findFirst({
            where: {
              userId: user.id,
              postId: payload.postId,
            },
          });
          if (existing) {
            return new HiddenPostEntry(existing);
          }
          const [row] = yield* database
            .insert(hiddenPosts)
            .values({
              id: v7(),
              userId: user.id,
              postId: payload.postId,
            })
            .returning();
          return new HiddenPostEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("unhide", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* database
            .delete(hiddenPosts)
            .where(and(eq(hiddenPosts.id, params.id), eq(hiddenPosts.userId, user.id)));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
