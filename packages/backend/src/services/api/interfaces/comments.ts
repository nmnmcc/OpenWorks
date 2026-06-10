import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { PortableText } from "../../../libraries/portable-text";
import { AuthMiddleware } from "./middlewares/auth";

export class Comment extends Schema.Class<Comment>("Comment")({
  id: Schema.String,
  content: PortableText,
  authorId: Schema.String,
  postId: Schema.String,
  parentId: Schema.NullOr(Schema.String),
  groupId: Schema.NullOr(Schema.String),
  removed: Schema.Boolean,
  score: Schema.Number,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class CommentNotFound extends Schema.TaggedErrorClass<CommentNotFound>()(
  "CommentNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class CommentForbidden extends Schema.TaggedErrorClass<CommentForbidden>()(
  "CommentForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class CommentTargetNotFound extends Schema.TaggedErrorClass<CommentTargetNotFound>()(
  "CommentTargetNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class PostLocked extends Schema.TaggedErrorClass<PostLocked>()("PostLocked", {}, { httpApiStatus: 403 }) {}

export class CommentsGroup extends HttpApiGroup.make("comments")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        postId: Schema.String,
      },
      success: Schema.Array(Comment),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Comment,
      error: [CommentNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        content: PortableText,
        postId: Schema.String,
        parentId: Schema.optional(Schema.String),
      }),
      success: Comment,
      error: [CommentForbidden, CommentTargetNotFound, PostLocked, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        content: PortableText,
      }),
      success: Comment,
      error: [CommentNotFound, CommentForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [CommentNotFound, CommentForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("remove", "/:id/remove", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        reason: Schema.optional(Schema.String),
      }),
      success: Comment,
      error: [CommentNotFound, CommentForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/comments") {}
