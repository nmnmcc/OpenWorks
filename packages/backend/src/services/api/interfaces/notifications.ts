import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class NotificationEntry extends Schema.Class<NotificationEntry>("NotificationEntry")({
  id: Schema.String,
  userId: Schema.String,
  type: Schema.String,
  title: Schema.String,
  body: Schema.NullOr(Schema.String),
  linkUrl: Schema.NullOr(Schema.String),
  isRead: Schema.Boolean,
  createdAt: Schema.DateFromString,
}) {}

export class NotificationNotFound extends Schema.TaggedErrorClass<NotificationNotFound>()(
  "NotificationNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class NotificationsGroup extends HttpApiGroup.make("notifications")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(NotificationEntry),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("unreadCount", "/unread-count", {
      success: Schema.Struct({ count: Schema.Number }),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.post("markRead", "/:id/read", {
      params: { id: Schema.String },
      success: NotificationEntry,
      error: [NotificationNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("markAllRead", "/read-all", {
      success: HttpApiSchema.NoContent,
      error: HttpApiError.InternalServerError,
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/notifications") {}
