import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class ModLogEntry extends Schema.Class<ModLogEntry>("ModLogEntry")({
  id: Schema.String,
  groupId: Schema.String,
  moderatorId: Schema.String,
  action: Schema.String,
  targetType: Schema.String,
  targetId: Schema.String,
  details: Schema.NullOr(Schema.Unknown),
  createdAt: Schema.DateFromString,
}) {}

export class ModLogForbidden extends Schema.TaggedErrorClass<ModLogForbidden>()(
  "ModLogForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class ModLogGroup extends HttpApiGroup.make("modLog")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        groupId: Schema.String,
      },
      success: Schema.Array(ModLogEntry),
      error: [ModLogForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/mod-log") {}
