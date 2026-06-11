import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class Vote extends Schema.Class<Vote>("Vote")({
  id: Schema.String,
  userId: Schema.String,
  postId: Schema.NullOr(Schema.String),
  commentId: Schema.NullOr(Schema.String),
  value: Schema.Number,
  createdAt: Schema.DateFromString,
}) {}

export class VoteForbidden extends Schema.TaggedErrorClass<VoteForbidden>()(
  "VoteForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class VoteConflict extends Schema.TaggedErrorClass<VoteConflict>()("VoteConflict", {}, { httpApiStatus: 409 }) {}

export class VoteTargetNotFound extends Schema.TaggedErrorClass<VoteTargetNotFound>()(
  "VoteTargetNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class VotesGroup extends HttpApiGroup.make("votes")
  .add(
    HttpApiEndpoint.post("cast", "/", {
      payload: Schema.Struct({
        postId: Schema.optional(Schema.String),
        commentId: Schema.optional(Schema.String),
        value: Schema.Literals([1, -1]),
      }),
      success: Vote,
      error: [VoteForbidden, VoteConflict, VoteTargetNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [VoteForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/votes") {}
