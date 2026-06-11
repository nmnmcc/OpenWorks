import { createServer } from "node:http";

import { NodeHttpServer, NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import { Api } from "./services/api";
import { Auth } from "./services/auth";
import { Config } from "./services/config";
import { Database, DatabasePool } from "./services/database";
import { Search } from "./services/search";

const DatabasePoolLive = DatabasePool.layer.pipe(Layer.provide(Config.layer));
const AuthLive = Auth.layer.pipe(Layer.provide(DatabasePoolLive), Layer.provide(Config.layer));
const DatabaseLive = Database.layer.pipe(Layer.provide(DatabasePoolLive));
const SearchLive = Search.layer.pipe(Layer.provide(DatabaseLive), Layer.provide(Config.layer));
const SearchSyncLive = Search.syncLayer.pipe(
  Layer.provide(SearchLive),
  Layer.provide(DatabaseLive),
  Layer.provide(Config.layer),
);

const layer = Layer.mergeAll(
  NodeHttpServer.layerHttpServices,
  NodeServices.layer,
  Config.layer,
  AuthLive,
  SearchSyncLive,
);

const program = Effect.gen(function* () {
  const config = yield* Config;
  const handler = yield* HttpRouter.toHttpEffect(Api);

  const server = yield* NodeHttpServer.make(createServer, {
    host: config.server.host,
    port: config.server.port,
  });

  yield* server.serve(handler);
  return yield* Effect.never;
}).pipe(Effect.provide(layer), Effect.scoped);

NodeRuntime.runMain(program);
