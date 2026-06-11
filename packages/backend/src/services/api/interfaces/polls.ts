import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class PollOptionEntry extends Schema.Class<PollOptionEntry>("PollOptionEntry")({
  id: Schema.String,
  pollId: Schema.String,
  text: Schema.String,
  position: Schema.Number,
  voteCount: Schema.Number,
}) {}

export class PollEntry extends Schema.Class<PollEntry>("PollEntry")({
  id: Schema.String,
  postId: Schema.String,
  votingEndsAt: Schema.NullOr(Schema.DateFromString),
  options: Schema.Array(PollOptionEntry),
  userVotedOptionId: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class PollNotFound extends Schema.TaggedErrorClass<PollNotFound>()("PollNotFound", {}, { httpApiStatus: 404 }) {}

export class PollForbidden extends Schema.TaggedErrorClass<PollForbidden>()(
  "PollForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class PollClosed extends Schema.TaggedErrorClass<PollClosed>()("PollClosed", {}, { httpApiStatus: 409 }) {}

export class PollsGroup extends HttpApiGroup.make("polls")
  .add(
    HttpApiEndpoint.get("getByPostId", "/:postId", {
      params: { postId: Schema.String },
      success: PollEntry,
      error: [PollNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("vote", "/:postId/vote", {
      params: { postId: Schema.String },
      payload: Schema.Struct({
        optionId: Schema.String,
      }),
      success: PollEntry,
      error: [PollNotFound, PollForbidden, PollClosed, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/polls") {}
