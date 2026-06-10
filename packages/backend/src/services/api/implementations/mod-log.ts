import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { Api, ModLogEntry, ModLogForbidden, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";

export const ModLogHandlers = HttpApiBuilder.group(
  Api,
  "modLog",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers.handle("list", ({ query }) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        yield* authorization.check(user.id, query.groupId, {
          action: "read",
          subject: "ModLog",
        });
        const rows = yield* database.query.modLog.findMany({
          where: { groupId: query.groupId },
          orderBy: { createdAt: "desc" },
        });
        return rows.map((row) => new ModLogEntry(row));
      }).pipe(
        Effect.catchTag("AuthorizationError", () => new ModLogForbidden()),
        Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
      ),
    );
  }),
);
