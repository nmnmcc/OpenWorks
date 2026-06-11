import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const inboxPageQuery = (offset: number) =>
  ApiClient.query("messages", "inbox", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.messages],
  });

export const sentPageQuery = (offset: number) =>
  ApiClient.query("messages", "sent", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.messages],
  });

export const sendMessageAtom = ApiClient.mutation("messages", "send");
export const markMessageReadAtom = ApiClient.mutation("messages", "markRead");
export const deleteMessageAtom = ApiClient.mutation("messages", "delete");
