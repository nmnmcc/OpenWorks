import { Effect, Layer } from "effect";
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Command } from "effect/unstable/cli";
import { database } from "./commands/database";
import { searchCommand } from "./commands/search";
import { Config } from "../services/config";
import { Database, DatabasePool } from "../services/database";
import { Search } from "../services/search";

const cli = Command.make("openworks").pipe(
  Command.withDescription("OpenWorks development CLI"),
  Command.withSubcommands([database, searchCommand]),
);

const MainLayer = Layer.mergeAll(Database.layer, Search.layer, NodeServices.layer).pipe(
  Layer.provide(DatabasePool.layer),
  Layer.provide(Config.layer),
);

Command.run(cli, { version: "0.1.0" }).pipe(Effect.provide(MainLayer), Effect.scoped, NodeRuntime.runMain);
