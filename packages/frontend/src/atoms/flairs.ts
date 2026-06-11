import { Keys } from "./keys";
import { ApiClient } from "./runtime";

export const postFlairsQuery = (spaceId: string) =>
  ApiClient.query("flairs", "listPostFlairs", {
    query: { spaceId },
    reactivityKeys: [Keys.postFlairs(spaceId)],
  });

export const userFlairQuery = (spaceId: string, userId: string) =>
  ApiClient.query("flairs", "getUserFlair", {
    query: { spaceId, userId },
    reactivityKeys: [Keys.userFlair(spaceId, userId)],
  });

export const createPostFlairAtom = ApiClient.mutation("flairs", "createPostFlair");
export const updatePostFlairAtom = ApiClient.mutation("flairs", "updatePostFlair");
export const deletePostFlairAtom = ApiClient.mutation("flairs", "deletePostFlair");
export const setUserFlairAtom = ApiClient.mutation("flairs", "setUserFlair");
export const removeUserFlairAtom = ApiClient.mutation("flairs", "removeUserFlair");
