import { Keys } from "./keys";
import { ApiClient } from "./runtime";

export const PAGE_SIZE = 25;

export interface FeedPageArgs {
  readonly feed?: "home" | "all";
  readonly spaceId?: string;
  readonly sort: "hot" | "new" | "top";
  readonly offset: number;
}

export const postsPageQuery = (args: FeedPageArgs) =>
  ApiClient.query("posts", "list", {
    query: {
      feed: args.feed,
      spaceId: args.spaceId,
      sort: args.sort,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [Keys.posts],
  });

export interface SearchArgs {
  readonly q: string;
  readonly spaceId?: string;
  readonly offset: number;
}

export const searchQuery = (args: SearchArgs) =>
  ApiClient.query("posts", "search", {
    query: {
      q: args.q,
      spaceId: args.spaceId,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
  });

export interface WorkPostsPageArgs {
  readonly workId: string;
  readonly kind?: "review" | "discussion";
  readonly sort: "hot" | "new" | "top";
  readonly offset: number;
}

export const workPostsPageQuery = (args: WorkPostsPageArgs) =>
  ApiClient.query("posts", "list", {
    query: {
      workId: args.workId,
      kind: args.kind,
      sort: args.sort,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [Keys.posts],
  });

export interface AuthorPostsPageArgs {
  readonly authorId: string;
  readonly kind?: "review" | "discussion";
  readonly offset: number;
}

export const authorPostsPageQuery = (args: AuthorPostsPageArgs) =>
  ApiClient.query("posts", "list", {
    query: {
      authorId: args.authorId,
      kind: args.kind,
      sort: "new",
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [Keys.posts],
  });

export const postQuery = (id: string) =>
  ApiClient.query("posts", "getById", {
    params: { id },
    reactivityKeys: [Keys.post(id)],
  });

export const createPostAtom = ApiClient.mutation("posts", "create");
export const updatePostAtom = ApiClient.mutation("posts", "update");
export const pinPostAtom = ApiClient.mutation("posts", "pin");
export const unpinPostAtom = ApiClient.mutation("posts", "unpin");
export const lockPostAtom = ApiClient.mutation("posts", "lock");
export const unlockPostAtom = ApiClient.mutation("posts", "unlock");
export const removePostAtom = ApiClient.mutation("posts", "remove");
export const deletePostAtom = ApiClient.mutation("posts", "delete");
