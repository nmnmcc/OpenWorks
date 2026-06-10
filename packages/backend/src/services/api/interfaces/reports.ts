import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class ReportEntry extends Schema.Class<ReportEntry>("ReportEntry")({
  id: Schema.String,
  groupId: Schema.String,
  reporterId: Schema.String,
  postId: Schema.NullOr(Schema.String),
  commentId: Schema.NullOr(Schema.String),
  reason: Schema.String,
  status: Schema.String,
  resolvedById: Schema.NullOr(Schema.String),
  resolutionNote: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class ReportNotFound extends Schema.TaggedErrorClass<ReportNotFound>()(
  "ReportNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class ReportForbidden extends Schema.TaggedErrorClass<ReportForbidden>()(
  "ReportForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class ReportTargetNotFound extends Schema.TaggedErrorClass<ReportTargetNotFound>()(
  "ReportTargetNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class ReportsGroup extends HttpApiGroup.make("reports")
  .add(
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        postId: Schema.optional(Schema.String),
        commentId: Schema.optional(Schema.String),
        reason: Schema.String,
      }),
      success: ReportEntry,
      error: [ReportForbidden, ReportTargetNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("list", "/", {
      query: {
        groupId: Schema.String,
        status: Schema.optional(Schema.String),
      },
      success: Schema.Array(ReportEntry),
      error: [ReportForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("resolve", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        status: Schema.Literals(["resolved", "dismissed"]),
        resolutionNote: Schema.optional(Schema.String),
      }),
      success: ReportEntry,
      error: [ReportNotFound, ReportForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/reports") {}
