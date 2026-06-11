import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export interface LibraryPageArgs {
  readonly userId?: string;
  readonly status?: string;
  readonly offset: number;
}

export const libraryPageQuery = (args: LibraryPageArgs) =>
  ApiClient.query("library", "list", {
    query: {
      userId: args.userId,
      status: args.status,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [args.userId ? Keys.libraryOf(args.userId) : Keys.library],
  });

export const libraryEntryQuery = (workId: string) =>
  ApiClient.query("library", "list", {
    query: { workId, limit: 1 },
    reactivityKeys: [Keys.library],
  });

export const upsertLibraryAtom = ApiClient.mutation("library", "upsert");
export const removeLibraryAtom = ApiClient.mutation("library", "remove");
