import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const wikiPagesPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("wiki", "listPages", {
    query: { spaceId, limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.wiki(spaceId)],
  });

export const wikiPageQuery = (pageId: string) =>
  ApiClient.query("wiki", "getPage", {
    params: { id: pageId },
    reactivityKeys: [Keys.wikiPage(pageId)],
  });

export const wikiRevisionsPageQuery = (pageId: string, offset: number) =>
  ApiClient.query("wiki", "listRevisions", {
    params: { id: pageId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.wikiPage(pageId)],
  });

export const createWikiPageAtom = ApiClient.mutation("wiki", "createPage");
export const updateWikiPageAtom = ApiClient.mutation("wiki", "updatePage");
export const deleteWikiPageAtom = ApiClient.mutation("wiki", "deletePage");
