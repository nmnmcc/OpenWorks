import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import { Api, UserProfile, UserNotFound, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { users } from "../../database/schema";

export const UsersHandlers = HttpApiBuilder.group(
  Api,
  "users",
  Effect.fn(function* (handlers) {
    const database = yield* Database;

    return handlers
      .handle("me", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const row = yield* database.query.users.findFirst({
            where: { id: user.id },
          });
          if (!row) {
            return yield* new HttpApiError.InternalServerError();
          }
          return new UserProfile(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* database.query.users.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new UserNotFound();
          }
          return new UserProfile(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("updateProfile", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const [row] = yield* database
            .update(users)
            .set({
              displayName: payload.displayName,
              bio: payload.bio,
              image: payload.image,
              banner: payload.banner,
            })
            .where(eq(users.id, user.id))
            .returning();
          return new UserProfile(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
