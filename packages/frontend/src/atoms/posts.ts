import { ApiClient } from "./runtime";

export const postsAtom = ApiClient.query("posts", "list", {
  query: {},
  reactivityKeys: ["posts"],
});

export const createPostAtom = ApiClient.mutation("posts", "create");
