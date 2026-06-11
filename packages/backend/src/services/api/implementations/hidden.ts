import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { hiddenPosts } from "../../database/schema/hidden-post";
import { Api } from "../interfaces";
import { HiddenPostEntry, HiddenTargetNotFound } from "../interfaces/hidden";
import { CurrentUser } from "../interfaces/middlewares/auth";

export const HiddenHandlers = HttpApiBuilder.group(
  Api,
  "hidden",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.hiddenPosts.findMany({
            where: {
              userId: user.id,
              postId: query.postId,
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
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
      .handle("unhide", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* database
            .delete(hiddenPosts)
            .where(and(eq(hiddenPosts.userId, user.id), eq(hiddenPosts.postId, query.postId)));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
