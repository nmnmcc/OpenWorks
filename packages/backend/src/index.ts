import { Effect, Layer } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { NodeHttpServer, NodeRuntime, NodeServices } from "@effect/platform-node";
import { createServer } from "node:http";
import { Api } from "./services/api/index";
import { Config } from "./services/config/index";
import { Auth } from "./services/auth/index";
import { Database, DatabasePool } from "./services/database/index";
import { Search } from "./services/search/index";
import { CdcLive } from "./services/cdc/index";

const DatabasePoolLive = DatabasePool.layer.pipe(Layer.provide(Config.layer));
const AuthLive = Auth.layer.pipe(Layer.provide(DatabasePoolLive));
const DatabaseLive = Database.layer.pipe(Layer.provide(DatabasePoolLive));
const SearchLive = Search.layer.pipe(Layer.provide(Config.layer));
const CdcLayer = CdcLive.pipe(Layer.provide(DatabaseLive), Layer.provide(SearchLive), Layer.provide(Config.layer));

const layer = Layer.mergeAll(NodeHttpServer.layerHttpServices, NodeServices.layer, Config.layer, AuthLive, CdcLayer);

const program = Effect.gen(function* () {
  const {
    server: { host, port },
  } = yield* Config;
  const auth = yield* Auth;

  const server = yield* NodeHttpServer.make(createServer, { host, port });
  const apiHandler = yield* HttpRouter.toHttpEffect(Api);

  yield* server.serve(
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;

      if (request.url.startsWith("/api/auth")) {
        const webRequest = yield* HttpServerRequest.toWeb(request);
        const webResponse = yield* Effect.promise(() => auth.handler(webRequest));
        return HttpServerResponse.fromWeb(webResponse);
      }

      return yield* apiHandler;
    }),
  );

  return yield* Effect.never;
}).pipe(Effect.provide(layer), Effect.scoped);

NodeRuntime.runMain(program);
