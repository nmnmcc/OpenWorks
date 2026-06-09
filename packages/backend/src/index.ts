import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import {
	NodeHttpServer,
	NodeRuntime,
	NodeServices,
} from "@effect/platform-node";
import { createServer } from "node:http";
import { Api } from "./services/api/index";
import { Config } from "./services/config/index";

const layer = Layer.mergeAll(
	NodeHttpServer.layerHttpServices,
	NodeServices.layer,
	Config.layer,
);

const program = Effect.gen(function* () {
	const {
		server: { host, port },
	} = yield* Config;

	const server = yield* NodeHttpServer.make(createServer, { host, port });
	const handler = yield* HttpRouter.toHttpEffect(Api);
	yield* server.serve(handler);

	return yield* Effect.never;
}).pipe(Effect.provide(layer), Effect.scoped);

NodeRuntime.runMain(program);
