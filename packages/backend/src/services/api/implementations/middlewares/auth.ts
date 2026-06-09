import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import {
	AuthMiddleware,
	CurrentSession,
	CurrentUser,
	Unauthorized,
} from "../../interfaces/middlewares/auth";
import { Auth } from "../../../auth/index";
import { isNotNullish } from "effect/Predicate";

export const AuthMiddlewareLive = Layer.effect(
	AuthMiddleware,
	Effect.gen(function* () {
		const auth = yield* Auth;

		return (next) =>
			Effect.gen(function* () {
				const request = yield* HttpServerRequest.HttpServerRequest;
				const headers = new globalThis.Headers(request.headers);

				const result = yield* auth.api.getSession({ headers }).pipe(
					Effect.filterOrFail(isNotNullish),
					Effect.mapError(() => new Unauthorized()),
				);

				return yield* next.pipe(
					Effect.provideService(CurrentSession, result.session),
					Effect.provideService(CurrentUser, result.user),
				);
			});
	}),
);
