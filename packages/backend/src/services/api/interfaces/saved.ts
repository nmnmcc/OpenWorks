import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class SavedItemEntry extends Schema.Class<SavedItemEntry>("SavedItemEntry")({
  id: Schema.String,
  userId: Schema.String,
  postId: Schema.NullOr(Schema.String),
  commentId: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class SavedConflict extends Schema.TaggedErrorClass<SavedConflict>()(
  "SavedConflict",
  {},
  { httpApiStatus: 409 },
) {}

export class SavedTargetNotFound extends Schema.TaggedErrorClass<SavedTargetNotFound>()(
  "SavedTargetNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class SavedGroup extends HttpApiGroup.make("saved")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        postId: Schema.optional(Schema.String),
        commentId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(SavedItemEntry),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.post("save", "/", {
      payload: Schema.Struct({
        postId: Schema.optional(Schema.String),
        commentId: Schema.optional(Schema.String),
      }),
      success: SavedItemEntry,
      error: [SavedConflict, SavedTargetNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unsave", "/", {
      query: {
        postId: Schema.optional(Schema.String),
        commentId: Schema.optional(Schema.String),
      },
      success: HttpApiSchema.NoContent,
      error: HttpApiError.InternalServerError,
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/saved") {}
