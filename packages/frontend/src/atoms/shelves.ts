import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export interface ShelvesPageArgs {
  readonly ownerId?: string;
  readonly workId?: string;
  readonly offset: number;
}

export const shelvesPageQuery = (args: ShelvesPageArgs) =>
  ApiClient.query("shelves", "list", {
    query: {
      ownerId: args.ownerId,
      workId: args.workId,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [Keys.shelves],
  });

export const shelfQuery = (id: string) =>
  ApiClient.query("shelves", "getById", {
    params: { id },
    reactivityKeys: [Keys.shelf(id)],
  });

export const shelfItemsQuery = (id: string, offset = 0) =>
  ApiClient.query("shelves", "getItems", {
    params: { id },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.shelfItems(id)],
  });

export const createShelfAtom = ApiClient.mutation("shelves", "create");
export const updateShelfAtom = ApiClient.mutation("shelves", "update");
export const deleteShelfAtom = ApiClient.mutation("shelves", "delete");
export const addShelfItemAtom = ApiClient.mutation("shelves", "addItem");
export const removeShelfItemAtom = ApiClient.mutation("shelves", "removeItem");
