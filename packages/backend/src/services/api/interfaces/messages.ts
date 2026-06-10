import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class MessageEntry extends Schema.Class<MessageEntry>("MessageEntry")({
  id: Schema.String,
  senderId: Schema.String,
  recipientId: Schema.String,
  subject: Schema.String,
  body: Schema.String,
  isRead: Schema.Boolean,
  createdAt: Schema.DateFromString,
}) {}

export class MessageNotFound extends Schema.TaggedErrorClass<MessageNotFound>()(
  "MessageNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class MessageForbidden extends Schema.TaggedErrorClass<MessageForbidden>()(
  "MessageForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class RecipientNotFound extends Schema.TaggedErrorClass<RecipientNotFound>()(
  "RecipientNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class MessagesGroup extends HttpApiGroup.make("messages")
  .add(
    HttpApiEndpoint.get("inbox", "/inbox", {
      success: Schema.Array(MessageEntry),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("sent", "/sent", {
      success: Schema.Array(MessageEntry),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: MessageEntry,
      error: [MessageNotFound, MessageForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("send", "/", {
      payload: Schema.Struct({
        recipientId: Schema.String,
        subject: Schema.String,
        body: Schema.String,
      }),
      success: MessageEntry,
      error: [RecipientNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("markRead", "/:id/read", {
      params: { id: Schema.String },
      success: MessageEntry,
      error: [MessageNotFound, MessageForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [MessageNotFound, MessageForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/messages") {}
