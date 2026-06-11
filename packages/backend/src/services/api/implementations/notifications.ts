import { and, count, eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { Config } from "../../config";
import { Database } from "../../database";
import { notifications } from "../../database/schema/notification";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { NotificationEntry, NotificationNotFound } from "../interfaces/notifications";

export const NotificationsHandlers = HttpApiBuilder.group(
  Api,
  "notifications",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.notifications.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new NotificationEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("unreadCount", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const [result] = yield* database
            .select({ count: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
          return { count: result?.count ?? 0 };
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("markRead", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const [row] = yield* database
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, params.id), eq(notifications.userId, user.id)))
            .returning();
          if (!row) {
            return yield* new NotificationNotFound();
          }
          return new NotificationEntry(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("markAllRead", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* database
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
