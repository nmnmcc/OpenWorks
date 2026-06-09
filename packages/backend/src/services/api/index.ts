import { Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api as Interfaces } from "./interfaces";
import { TodosHandlers, HealthHandlers } from "./implementations";
import { Auth } from "../auth/index";
import { DatabasePool } from "../database/index";
import { AuthMiddlewareLive } from "./implementations/middlewares/auth";

export const Api = HttpApiBuilder.layer(Interfaces).pipe(
	Layer.provide([
		TodosHandlers.pipe(
			Layer.provide(AuthMiddlewareLive),
			Layer.provide(Auth.layer),
			Layer.provide(DatabasePool.layer),
		),
		HealthHandlers,
	]),
);
