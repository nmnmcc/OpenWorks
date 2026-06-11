import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const creatorsPageQuery = (q?: string, offset = 0) =>
  ApiClient.query("creators", "list", {
    query: { q, limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.creators],
  });

export const creatorQuery = (id: string) =>
  ApiClient.query("creators", "getById", {
    params: { id },
    reactivityKeys: [Keys.creator(id)],
  });

export const creatorWorksQuery = (id: string) =>
  ApiClient.query("creators", "getWorks", {
    params: { id },
    query: {},
    reactivityKeys: [Keys.creatorWorks(id)],
  });

export const creatorRevisionsQuery = (id: string) =>
  ApiClient.query("creators", "getRevisions", {
    params: { id },
    query: {},
    reactivityKeys: [Keys.creatorRevisions(id)],
  });

export const createCreatorAtom = ApiClient.mutation("creators", "create");
export const updateCreatorAtom = ApiClient.mutation("creators", "update");
