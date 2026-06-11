import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class UserProfile extends Schema.Class<UserProfile>("UserProfile")({
  id: Schema.String,
  name: Schema.String,
  displayName: Schema.NullOr(Schema.String),
  bio: Schema.NullOr(Schema.String),
  image: Schema.NullOr(Schema.String),
  banner: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class UserSearchResult extends Schema.Class<UserSearchResult>("UserSearchResult")({
  hits: Schema.Array(UserProfile),
  query: Schema.String,
  estimatedTotalHits: Schema.Number,
  processingTimeMs: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()("UserNotFound", {}, { httpApiStatus: 404 }) {}

export class UsersGroup extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: UserSearchResult,
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("me", "/me", {
      success: UserProfile,
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: UserProfile,
      error: [UserNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("updateProfile", "/me", {
      payload: Schema.Struct({
        displayName: Schema.optional(Schema.NullOr(Schema.String)),
        bio: Schema.optional(Schema.NullOr(Schema.String)),
        image: Schema.optional(Schema.NullOr(Schema.String)),
        banner: Schema.optional(Schema.NullOr(Schema.String)),
      }),
      success: UserProfile,
      error: HttpApiError.InternalServerError,
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/users") {}
