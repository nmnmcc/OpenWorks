import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const savedPageQuery = (offset: number) =>
  ApiClient.query("saved", "list", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.saved],
  });

export interface SavedTarget {
  readonly postId?: string;
  readonly commentId?: string;
}

export const savedEntryQuery = (target: SavedTarget) =>
  ApiClient.query("saved", "list", {
    query: { postId: target.postId, commentId: target.commentId, limit: 1 },
    reactivityKeys: [Keys.saved],
  });

export const saveItemAtom = ApiClient.mutation("saved", "save");
export const unsaveItemAtom = ApiClient.mutation("saved", "unsave");
