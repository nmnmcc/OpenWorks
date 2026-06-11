import { Keys } from "./keys";
import { ApiClient } from "./runtime";

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
