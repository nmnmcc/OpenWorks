import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class HiddenPostEntry extends Schema.Class<HiddenPostEntry>("HiddenPostEntry")({
  id: Schema.String,
  userId: Schema.String,
  postId: Schema.String,
  createdAt: Schema.DateFromString,
}) {}

export class HiddenTargetNotFound extends Schema.TaggedErrorClass<HiddenTargetNotFound>()(
  "HiddenTargetNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class HiddenGroup extends HttpApiGroup.make("hidden")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        postId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(HiddenPostEntry),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.post("hide", "/", {
      payload: Schema.Struct({
        postId: Schema.String,
      }),
      success: HiddenPostEntry,
      error: [HiddenTargetNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unhide", "/", {
      query: {
        postId: Schema.String,
      },
      success: HttpApiSchema.NoContent,
      error: HttpApiError.InternalServerError,
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/hidden") {}
