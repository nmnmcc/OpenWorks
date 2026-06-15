import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const userSearchQuery = (q: string, offset = 0) =>
  ApiClient.query("users", "search", {
    query: { q, limit: PAGE_SIZE, offset },
  });

export const meQuery = ApiClient.query("users", "me", {
  reactivityKeys: [Keys.me],
});

export const userQuery = (id: string) =>
  ApiClient.query("users", "getById", {
    params: { id },
    reactivityKeys: [Keys.user(id)],
    timeToLive: "5 minutes",
  });

export const updateProfileAtom = ApiClient.mutation("users", "updateProfile");
