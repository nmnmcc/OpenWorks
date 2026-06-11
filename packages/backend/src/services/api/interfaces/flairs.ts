import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class PostFlairEntry extends Schema.Class<PostFlairEntry>("PostFlairEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  name: Schema.String,
  color: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class UserFlairEntry extends Schema.Class<UserFlairEntry>("UserFlairEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  userId: Schema.String,
  text: Schema.String,
  color: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class FlairNotFound extends Schema.TaggedErrorClass<FlairNotFound>()(
  "FlairNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class FlairForbidden extends Schema.TaggedErrorClass<FlairForbidden>()(
  "FlairForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class FlairsGroup extends HttpApiGroup.make("flairs")
  .add(
    HttpApiEndpoint.get("listPostFlairs", "/post-flairs", {
      query: {
        spaceId: Schema.String,
      },
      success: Schema.Array(PostFlairEntry),
      error: [FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("createPostFlair", "/post-flairs", {
      payload: Schema.Struct({
        spaceId: Schema.String,
        name: Schema.String,
        color: Schema.optional(Schema.String),
      }),
      success: PostFlairEntry,
      error: [FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("updatePostFlair", "/post-flairs/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        name: Schema.optional(Schema.String),
        color: Schema.optional(Schema.NullOr(Schema.String)),
      }),
      success: PostFlairEntry,
      error: [FlairNotFound, FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("deletePostFlair", "/post-flairs/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [FlairNotFound, FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("getUserFlair", "/user-flairs", {
      query: {
        spaceId: Schema.String,
        userId: Schema.String,
      },
      success: Schema.NullOr(UserFlairEntry),
      error: [FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.put("setUserFlair", "/user-flairs", {
      payload: Schema.Struct({
        spaceId: Schema.String,
        userId: Schema.String,
        text: Schema.String,
        color: Schema.optional(Schema.String),
      }),
      success: UserFlairEntry,
      error: [FlairForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("removeUserFlair", "/user-flairs", {
      query: {
        spaceId: Schema.String,
        userId: Schema.String,
      },
      success: HttpApiSchema.NoContent,
      error: [FlairForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/flairs") {}
