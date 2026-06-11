import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { ModerationLog, ModerationLogForbidden } from "../interfaces/moderation-log";

export const ModerationLogsHandlers = HttpApiBuilder.group(
  Api,
  "moderationLogs",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers.handle("list", ({ query }) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        yield* authorization.check(user.id, query.spaceId, {
          action: "read",
          subject: "ModLog",
        });
        const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
        const offset = query.offset ?? 0;
        const rows = yield* database.query.modLog.findMany({
          where: { spaceId: query.spaceId },
          orderBy: { createdAt: "desc" },
          limit,
          offset,
        });
        return rows.map((row) => new ModerationLog(row));
      }).pipe(
        Effect.catchTag("AuthorizationError", () => new ModerationLogForbidden()),
        Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
        Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
      ),
    );
  }),
);
