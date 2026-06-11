import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const notificationsPageQuery = (offset: number) =>
  ApiClient.query("notifications", "list", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.notifications],
  });

export const unreadCountQuery = ApiClient.query("notifications", "unreadCount", {
  reactivityKeys: [Keys.notifications],
});

export const markNotificationReadAtom = ApiClient.mutation("notifications", "markRead");
export const markAllNotificationsReadAtom = ApiClient.mutation("notifications", "markAllRead");
