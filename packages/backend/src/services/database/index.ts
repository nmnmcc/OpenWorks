import { PgClient } from "@effect/sql-pg";
import * as EffectPostgres from "drizzle-orm/effect-postgres";
import { Context, Duration, Effect, Layer, Redacted, Schedule } from "effect";
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

      const pool = yield* Effect.acquireRelease(
        Effect.sync(
          () =>
            new Pool({
              connectionString: Redacted.value(config.database.url),
            }),
        ),
        (pool) => Effect.tryPromise(() => pool.end()),
      );

      yield* Effect.tryPromise(async () => {
        const client = await pool.connect();
        client.release();
      }).pipe(
        Effect.retry(Schedule.exponential("1 second").pipe(
          Schedule.modifyDelay((_, delay) => Effect.succeed(Duration.min(delay, Duration.seconds(10)))),
          Schedule.take(10),
        )),
        Effect.tap(() => Effect.log("Database: connected to PostgreSQL")),
      );

      return pool;
    }),
  );
}
