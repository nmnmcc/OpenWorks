import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Config } from "../../config";
import { Database } from "../../database";
import { users } from "../../database/schema/auth";
import { Search } from "../../search";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { UserNotFound, UserProfile, UserSearchResult } from "../interfaces/users";

export const UsersHandlers = HttpApiBuilder.group(
  Api,
  "users",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const search = yield* Search;

    return handlers
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchUsers({ q: query.q, limit, offset });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new UserSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.users.findMany({
            where: { id: { in: ids } },
          });

          const rowMap = new Map(rows.map((row) => [row.id, row]));
          const hits = ids
            .map((id) => rowMap.get(id))
            .filter((row): row is (typeof rows)[number] => row !== undefined)
            .map((row) => new UserProfile(row));

          return new UserSearchResult({
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
