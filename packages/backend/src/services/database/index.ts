import { PgClient } from "@effect/sql-pg";
import * as EffectPostgres from "drizzle-orm/effect-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import { Reactivity } from "effect/unstable/reactivity";
import { Pool } from "pg";

import { Config } from "../config";
import { relations } from "./relations";
import type * as schema from "./schema/all";

export type Schema = typeof schema;
export type Relations = typeof relations;

export class Database extends Context.Service<Database, EffectPostgres.EffectPgDatabase<Relations>>()(
  "@openworks/frontend/services/database/Database",
) {}

export namespace Database {
  export const layer = Layer.effect(
    Database,
    Effect.gen(function* () {
      const pool = yield* DatabasePool;

      return yield* EffectPostgres.makeWithDefaults({ relations }).pipe(
        Effect.provideServiceEffect(PgClient.PgClient, PgClient.fromPool({ acquire: Effect.succeed(pool) })),
      );
    }),
  ).pipe(Layer.provide(Reactivity.layer));
}

export class DatabasePool extends Context.Service<DatabasePool, Pool>()(
  "@openworks/frontend/services/database/DatabasePool",
) {}

export namespace DatabasePool {
  export const layer = Layer.effect(
    DatabasePool,
    Effect.gen(function* () {
      const config = yield* Config;

      return yield* Effect.acquireRelease(
        Effect.sync(
          () =>
            new Pool({
              connectionString: Redacted.value(config.database.url),
            }),
        ),
        (pool) => Effect.tryPromise(() => pool.end()),
      );
    }),
  );
}
