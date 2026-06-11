import { Keys } from "./keys";
import { ApiClient } from "./runtime";

export const commentsQuery = (postId: string) =>
  ApiClient.query("comments", "list", {
    query: { postId },
    reactivityKeys: [Keys.comments(postId)],
  });

export const commentQuery = (id: string) =>
  ApiClient.query("comments", "getById", {
    params: { id },
    timeToLive: "5 minutes",
  });

export const createCommentAtom = ApiClient.mutation("comments", "create");
export const updateCommentAtom = ApiClient.mutation("comments", "update");
export const deleteCommentAtom = ApiClient.mutation("comments", "delete");
export const removeCommentAtom = ApiClient.mutation("comments", "remove");
