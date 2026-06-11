import { Keys } from "./keys";
import { ApiClient } from "./runtime";

export const pollQuery = (postId: string) =>
  ApiClient.query("polls", "getByPostId", {
    params: { postId },
    reactivityKeys: [Keys.poll(postId)],
  });

export const votePollAtom = ApiClient.mutation("polls", "vote");
