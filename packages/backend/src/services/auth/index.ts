import { Context, Data, Effect, Layer, Record } from "effect";
import { make } from "./make";
import { DatabasePool } from "../database";
import { APIError } from "better-auth";

export class Auth extends Context.Service<Auth>()("@openworks/frontend/services/auth/Auth", {
  make: Effect.gen(function* () {
    const pool = yield* DatabasePool;
    const auth = make(pool);

    type API = {
      [K in keyof typeof auth.api]: (typeof auth.api)[K] extends (...args: infer A) => PromiseLike<infer R>
        ? (...args: A) => Effect.Effect<R, Auth.Error.API | Auth.Error.Unknown>
        : never;
    };

    return {
      ...auth,
      api: Record.map(
        auth.api,
        (endpoint: any) => (params: unknown) =>
          Effect.tryPromise({
            try: () => endpoint(params),
            catch: (cause) =>
              cause instanceof APIError ? new Auth.Error.API({ cause }) : new Auth.Error.Unknown({ cause }),
          }),
      ) as unknown as API,
    };
  }),
}) {}

export namespace Auth {
  export const layer = Layer.effect(Auth, Auth.make);

  export namespace Error {
    export class Unknown extends Data.TaggedError("Unknown")<{
      cause: unknown;
    }> {}
    export class API extends Data.TaggedError("API")<{
      cause: APIError;
    }> {}
  }
}
