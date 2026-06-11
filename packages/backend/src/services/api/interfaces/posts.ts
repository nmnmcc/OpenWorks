import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { PortableText } from "../../../libraries/portable-text";
import { AuthMiddleware } from "./middlewares/auth";

export class Post extends Schema.Class<Post>("Post")({
  id: Schema.String,
  title: Schema.String,
  type: Schema.String,
  content: Schema.NullOr(PortableText),
  url: Schema.NullOr(Schema.String),
  authorId: Schema.String,
  spaceId: Schema.NullOr(Schema.String),
  flairId: Schema.NullOr(Schema.String),
  pinned: Schema.Boolean,
  locked: Schema.Boolean,
  nsfw: Schema.Boolean,
  spoiler: Schema.Boolean,
  removed: Schema.Boolean,
  commentCount: Schema.Number,
  score: Schema.Number,
  workId: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class PostSearchResult extends Schema.Class<PostSearchResult>("PostSearchResult")({
  hits: Schema.Array(Post),
  query: Schema.String,
  estimatedTotalHits: Schema.Number,
  processingTimeMs: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}) {}

export class PostNotFound extends Schema.TaggedErrorClass<PostNotFound>()("PostNotFound", {}, { httpApiStatus: 404 }) {}

export class PostForbidden extends Schema.TaggedErrorClass<PostForbidden>()(
  "PostForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class PostSpaceNotFound extends Schema.TaggedErrorClass<PostSpaceNotFound>()(
  "PostSpaceNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class InvalidPoll extends Schema.TaggedErrorClass<InvalidPoll>()("InvalidPoll", {}, { httpApiStatus: 400 }) {}

export class InvalidFlair extends Schema.TaggedErrorClass<InvalidFlair>()("InvalidFlair", {}, { httpApiStatus: 400 }) {}

export class ReviewConflict extends Schema.TaggedErrorClass<ReviewConflict>()("ReviewConflict", {}, { httpApiStatus: 409 }) {}

export class PostWorkNotFound extends Schema.TaggedErrorClass<PostWorkNotFound>()(
  "PostWorkNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class PostsGroup extends HttpApiGroup.make("posts")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        spaceId: Schema.optional(Schema.String),
        feed: Schema.optional(Schema.Literals(["home", "all"])),
        sort: Schema.optional(Schema.Literals(["hot", "new", "top"])),
        workId: Schema.optional(Schema.String),
        kind: Schema.optional(Schema.Literals(["review", "discussion"])),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(Post),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        spaceId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: PostSearchResult,
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Post,
      error: [PostNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        title: Schema.String,
        type: Schema.optional(Schema.Literals(["text", "link", "image", "poll", "review"])),
        workId: Schema.optional(Schema.String),
        content: Schema.optional(PortableText),
        url: Schema.optional(Schema.String),
        spaceId: Schema.optional(Schema.String),
        flairId: Schema.optional(Schema.String),
        nsfw: Schema.optional(Schema.Boolean),
        spoiler: Schema.optional(Schema.Boolean),
        pollOptions: Schema.optional(Schema.Array(Schema.String)),
        pollEndsAt: Schema.optional(Schema.DateFromString),
      }),
      success: Post,
      error: [PostForbidden, PostSpaceNotFound, InvalidPoll, InvalidFlair, ReviewConflict, PostWorkNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        content: Schema.optional(PortableText),
        url: Schema.optional(Schema.String),
        flairId: Schema.optional(Schema.NullOr(Schema.String)),
        nsfw: Schema.optional(Schema.Boolean),
        spoiler: Schema.optional(Schema.Boolean),
      }),
      success: Post,
      error: [PostNotFound, PostForbidden, InvalidFlair, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("pin", "/:id/pin", {
      params: { id: Schema.String },
      success: Post,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("unpin", "/:id/unpin", {
      params: { id: Schema.String },
      success: Post,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("lock", "/:id/lock", {
      params: { id: Schema.String },
      success: Post,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("unlock", "/:id/unlock", {
      params: { id: Schema.String },
      success: Post,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("remove", "/:id/remove", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        reason: Schema.optional(Schema.String),
      }),
      success: Post,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [PostNotFound, PostForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/posts") {}
