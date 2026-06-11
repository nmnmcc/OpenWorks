import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const hiddenPageQuery = (offset: number) =>
  ApiClient.query("hidden", "list", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.hidden],
  });

export const hiddenEntryQuery = (postId: string) =>
  ApiClient.query("hidden", "list", {
    query: { postId, limit: 1 },
    reactivityKeys: [Keys.hidden],
  });

export const hidePostAtom = ApiClient.mutation("hidden", "hide");
export const unhidePostAtom = ApiClient.mutation("hidden", "unhide");
