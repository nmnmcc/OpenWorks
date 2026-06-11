import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class ModerationLog extends Schema.Class<ModerationLog>("ModerationLog")({
  id: Schema.String,
  spaceId: Schema.String,
  moderatorId: Schema.String,
  action: Schema.String,
  targetType: Schema.String,
  targetId: Schema.String,
  details: Schema.NullOr(Schema.Unknown),
  createdAt: Schema.DateFromString,
}) {}

export class ModerationLogForbidden extends Schema.TaggedErrorClass<ModerationLogForbidden>()(
  "ModerationLogForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class ModerationLogsGroup extends HttpApiGroup.make("moderationLogs")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        spaceId: Schema.String,
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(ModerationLog),
      error: [ModerationLogForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/moderation-logs") {}
