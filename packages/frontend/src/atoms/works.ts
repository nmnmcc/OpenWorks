import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export interface WorksPageArgs {
  readonly type?: string;
  readonly sort?: "popular" | "new" | "top";
  readonly tag?: string;
  readonly offset: number;
}

export const worksPageQuery = (args: WorksPageArgs) =>
  ApiClient.query("works", "list", {
    query: {
      type: args.type,
      sort: args.sort,
      tag: args.tag,
      limit: PAGE_SIZE,
      offset: args.offset,
    },
    reactivityKeys: [Keys.works],
  });

export const workSearchQuery = (q: string, type?: string, offset = 0) =>
  ApiClient.query("works", "search", {
    query: { q, type, limit: PAGE_SIZE, offset },
  });

export const workQuery = (id: string) =>
  ApiClient.query("works", "getById", {
    params: { id },
    reactivityKeys: [Keys.work(id)],
  });

export const workRevisionsQuery = (id: string) =>
  ApiClient.query("works", "getRevisions", {
    params: { id },
    query: {},
    reactivityKeys: [Keys.workRevisions(id)],
  });

export const workVariantsQuery = (id: string) =>
  ApiClient.query("works", "getVariants", {
    params: { id },
    reactivityKeys: [Keys.workVariants(id)],
  });

export const workCreditsQuery = (id: string) =>
  ApiClient.query("works", "getCredits", {
    params: { id },
    reactivityKeys: [Keys.workCredits(id)],
  });

export const workTagsQuery = (id: string) =>
  ApiClient.query("works", "getTags", {
    params: { id },
    reactivityKeys: [Keys.workTags(id)],
  });

export const workAliasesQuery = (id: string) =>
  ApiClient.query("works", "getAliases", {
    params: { id },
    reactivityKeys: [Keys.workAliases(id)],
  });

export const workChaptersQuery = (id: string) =>
  ApiClient.query("works", "getChapters", {
    params: { id },
    reactivityKeys: [Keys.workChapters(id)],
  });

export const chapterQuery = (chapterId: string) =>
  ApiClient.query("works", "getChapter", {
    params: { chapterId },
    reactivityKeys: [Keys.chapter(chapterId)],
  });

export const workRatingQuery = (id: string) =>
  ApiClient.query("works", "getMyRating", {
    params: { id },
    reactivityKeys: [Keys.workRating(id)],
  });

export const workRequirementsQuery = (id: string) =>
  ApiClient.query("works", "getRequirements", {
    params: { id },
    reactivityKeys: [Keys.workRequirements(id)],
  });

export const tagsAutocompleteQuery = (q: string) =>
  ApiClient.query("works", "searchTags", {
    query: { q, limit: 10 },
  });

export const createWorkAtom = ApiClient.mutation("works", "create");
export const updateWorkAtom = ApiClient.mutation("works", "update");
export const deleteWorkAtom = ApiClient.mutation("works", "delete");
export const setCreditsAtom = ApiClient.mutation("works", "setCredits");
export const addTagAtom = ApiClient.mutation("works", "addTag");
export const removeTagAtom = ApiClient.mutation("works", "removeTag");
export const addAliasAtom = ApiClient.mutation("works", "addAlias");
export const removeAliasAtom = ApiClient.mutation("works", "removeAlias");
export const createChapterAtom = ApiClient.mutation("works", "createChapter");
export const updateChapterAtom = ApiClient.mutation("works", "updateChapter");
export const deleteChapterAtom = ApiClient.mutation("works", "deleteChapter");
export const markChapterReadAtom = ApiClient.mutation("works", "markChapterRead");
export const unmarkChapterReadAtom = ApiClient.mutation("works", "unmarkChapterRead");
export const setRatingAtom = ApiClient.mutation("works", "setRating");
export const deleteRatingAtom = ApiClient.mutation("works", "deleteRating");
export const setRequirementsAtom = ApiClient.mutation("works", "setRequirements");
