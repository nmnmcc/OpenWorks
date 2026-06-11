import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/effect-postgres/migrator";
import { Console, Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import { Database } from "../../../services/database";
import { runSeed } from "./seed";

const seed = Command.make("seed", {
  clean: Flag.boolean("clean").pipe(Flag.withDescription("Truncate all tables before seeding")),
}).pipe(
  Command.withDescription("Seed the database with development data"),
  Command.withHandler(
    Effect.fnUntraced(function* ({ clean }) {
      const database = yield* Database;
      yield* runSeed(database, clean);
    }),
  ),
);

const reset = Command.make("reset", {
  seed: Flag.boolean("seed").pipe(Flag.withDescription("Run seed after reset")),
}).pipe(
  Command.withDescription("Drop all tables, re-run migrations"),
  Command.withHandler(
    Effect.fnUntraced(function* ({ seed: shouldSeed }) {
      const database = yield* Database;

      yield* Console.log("Dropping schema...");
      yield* database.execute(sql`DROP SCHEMA public CASCADE`);
      yield* database.execute(sql`CREATE SCHEMA public`);
      yield* Console.log("Schema dropped");

      yield* Console.log("Running migrations...");
      yield* migrate(database, {
        migrationsFolder: "./src/services/database/migrations",
      });
      yield* Console.log("Migrations complete");

      if (shouldSeed) {
        yield* runSeed(database, false);
      }
    }),
  ),
);

export const database = Command.make("database").pipe(
  Command.withDescription("Database management commands"),
  Command.withSubcommands([seed, reset]),
);
