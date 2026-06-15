import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { PortableText } from "../../../libraries/portable-text";
import { AuthMiddleware, OptionalAuthMiddleware } from "./middlewares/auth";

export class Work extends Schema.Class<Work>("Work")({
  id: Schema.String,
  type: Schema.String,
  title: Schema.String,
  originalTitle: Schema.NullOr(Schema.String),
  description: Schema.NullOr(PortableText),
  coverUrl: Schema.NullOr(Schema.String),
  releaseDate: Schema.NullOr(Schema.DateFromString),
  isbn: Schema.NullOr(Schema.String),
  pageCount: Schema.NullOr(Schema.Number),
  runtimeMinutes: Schema.NullOr(Schema.Number),
  seasonCount: Schema.NullOr(Schema.Number),
  episodeCount: Schema.NullOr(Schema.Number),
  platforms: Schema.NullOr(Schema.Array(Schema.String)),
  website: Schema.NullOr(Schema.String),
  nsfw: Schema.Boolean,
  targetWorkId: Schema.NullOr(Schema.String),
  createdById: Schema.NullOr(Schema.String),
  ratingCount: Schema.Number,
  ratingSum: Schema.Number,
  recommendedCount: Schema.Number,
  reviewCount: Schema.Number,
  libraryCount: Schema.Number,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class WorkRevisionEntry extends Schema.Class<WorkRevisionEntry>("WorkRevisionEntry")({
  id: Schema.String,
  workId: Schema.String,
  editedById: Schema.String,
  snapshot: Schema.Unknown,
  reason: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class WorkCreditEntry extends Schema.Class<WorkCreditEntry>("WorkCreditEntry")({
  id: Schema.String,
  workId: Schema.String,
  creatorId: Schema.String,
  creatorName: Schema.String,
  creatorImageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
  characterName: Schema.NullOr(Schema.String),
  position: Schema.Number,
}) {}

export class WorkTagEntry extends Schema.Class<WorkTagEntry>("WorkTagEntry")({
  id: Schema.String,
  name: Schema.String,
  count: Schema.Number,
  appliedByMe: Schema.Boolean,
}) {}

export class WorkAliasEntry extends Schema.Class<WorkAliasEntry>("WorkAliasEntry")({
  id: Schema.String,
  workId: Schema.String,
  value: Schema.String,
  kind: Schema.String,
  createdById: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class WorkChapterEntry extends Schema.Class<WorkChapterEntry>("WorkChapterEntry")({
  id: Schema.String,
  workId: Schema.String,
  title: Schema.String,
  position: Schema.Number,
  isRead: Schema.Boolean,
  createdAt: Schema.DateFromString,
}) {}

export class WorkChapterDetail extends Schema.Class<WorkChapterDetail>("WorkChapterDetail")({
  id: Schema.String,
  workId: Schema.String,
  title: Schema.String,
  position: Schema.Number,
  content: Schema.NullOr(PortableText),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class WorkRatingEntry extends Schema.Class<WorkRatingEntry>("WorkRatingEntry")({
  id: Schema.String,
  workId: Schema.String,
  userId: Schema.String,
  value: Schema.Number,
  createdAt: Schema.DateFromString,
}) {}

export class WorkSystemRequirementEntry extends Schema.Class<WorkSystemRequirementEntry>("WorkSystemRequirementEntry")({
  id: Schema.String,
  workId: Schema.String,
  platform: Schema.String,
  tier: Schema.String,
  os: Schema.NullOr(Schema.String),
  cpu: Schema.NullOr(Schema.String),
  memory: Schema.NullOr(Schema.String),
  graphics: Schema.NullOr(Schema.String),
  storage: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
}) {}

export class WorkSpaceEntry extends Schema.Class<WorkSpaceEntry>("WorkSpaceEntry")({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  icon: Schema.NullOr(Schema.String),
  memberCount: Schema.Number,
}) {}

export class WorkSearchResult extends Schema.Class<WorkSearchResult>("WorkSearchResult")({
  hits: Schema.Array(Work),
  query: Schema.String,
  estimatedTotalHits: Schema.Number,
  processingTimeMs: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}) {}

export class WorkNotFound extends Schema.TaggedErrorClass<WorkNotFound>()("WorkNotFound", {}, { httpApiStatus: 404 }) {}

export class WorkForbidden extends Schema.TaggedErrorClass<WorkForbidden>()(
  "WorkForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class InvalidWorkPayload extends Schema.TaggedErrorClass<InvalidWorkPayload>()(
  "InvalidWorkPayload",
  {},
  { httpApiStatus: 400 },
) {}

export class InvalidCredits extends Schema.TaggedErrorClass<InvalidCredits>()(
  "InvalidCredits",
  {},
  { httpApiStatus: 400 },
) {}

export class ChapterNotFound extends Schema.TaggedErrorClass<ChapterNotFound>()(
  "ChapterNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class TagConflict extends Schema.TaggedErrorClass<TagConflict>()("TagConflict", {}, { httpApiStatus: 409 }) {}

export class AliasConflict extends Schema.TaggedErrorClass<AliasConflict>()(
  "AliasConflict",
  {},
  { httpApiStatus: 409 },
) {}

export class WorksGroup extends HttpApiGroup.make("works")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        type: Schema.optional(Schema.String),
        tag: Schema.optional(Schema.String),
        sort: Schema.optional(Schema.Literals(["popular", "new", "top"])),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(Work),
      error: HttpApiError.InternalServerError,
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        type: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: WorkSearchResult,
      error: HttpApiError.InternalServerError,
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Work,
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        type: Schema.Literals(["book", "movie", "tv", "game"]),
        title: Schema.String,
        originalTitle: Schema.optional(Schema.String),
        description: Schema.optional(PortableText),
        coverUrl: Schema.optional(Schema.String),
        releaseDate: Schema.optional(Schema.DateFromString),
        isbn: Schema.optional(Schema.String),
        pageCount: Schema.optional(Schema.Number),
        runtimeMinutes: Schema.optional(Schema.Number),
        seasonCount: Schema.optional(Schema.Number),
        episodeCount: Schema.optional(Schema.Number),
        platforms: Schema.optional(Schema.Array(Schema.String)),
        website: Schema.optional(Schema.String),
        nsfw: Schema.optional(Schema.Boolean),
        targetWorkId: Schema.optional(Schema.String),
      }),
      success: Work,
      error: [InvalidWorkPayload, WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        originalTitle: Schema.optional(Schema.NullOr(Schema.String)),
        description: Schema.optional(Schema.NullOr(PortableText)),
        coverUrl: Schema.optional(Schema.NullOr(Schema.String)),
        releaseDate: Schema.optional(Schema.NullOr(Schema.DateFromString)),
        isbn: Schema.optional(Schema.NullOr(Schema.String)),
        pageCount: Schema.optional(Schema.NullOr(Schema.Number)),
        runtimeMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
        seasonCount: Schema.optional(Schema.NullOr(Schema.Number)),
        episodeCount: Schema.optional(Schema.NullOr(Schema.Number)),
        platforms: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
        website: Schema.optional(Schema.NullOr(Schema.String)),
        nsfw: Schema.optional(Schema.Boolean),
        targetWorkId: Schema.optional(Schema.NullOr(Schema.String)),
        reason: Schema.optional(Schema.String),
      }),
      success: Work,
      error: [WorkNotFound, InvalidWorkPayload, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WorkNotFound, WorkForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getRevisions", "/:id/revisions", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(WorkRevisionEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getVariants", "/:id/variants", {
      params: { id: Schema.String },
      success: Schema.Array(Work),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getSpaces", "/:id/spaces", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(WorkSpaceEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getCredits", "/:id/credits", {
      params: { id: Schema.String },
      success: Schema.Array(WorkCreditEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.put("setCredits", "/:id/credits", {
      params: { id: Schema.String },
      payload: Schema.Array(
        Schema.Struct({
          creatorId: Schema.String,
          role: Schema.String,
          characterName: Schema.optional(Schema.String),
        }),
      ),
      success: Schema.Array(WorkCreditEntry),
      error: [WorkNotFound, InvalidCredits, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getMyRating", "/:id/rating", {
      params: { id: Schema.String },
      success: Schema.NullOr(WorkRatingEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.put("setRating", "/:id/rating", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        value: Schema.Number,
      }),
      success: WorkRatingEntry,
      error: [WorkNotFound, InvalidWorkPayload, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("deleteRating", "/:id/rating", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getTags", "/:id/tags", {
      params: { id: Schema.String },
      success: Schema.Array(WorkTagEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("addTag", "/:id/tags", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        name: Schema.String,
      }),
      success: WorkTagEntry,
      error: [WorkNotFound, TagConflict, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("removeTag", "/:id/tags/:tagId", {
      params: { id: Schema.String, tagId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("searchTags", "/tags", {
      query: {
        q: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(Schema.Struct({ id: Schema.String, name: Schema.String })),
      error: HttpApiError.InternalServerError,
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getAliases", "/:id/aliases", {
      params: { id: Schema.String },
      success: Schema.Array(WorkAliasEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("addAlias", "/:id/aliases", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        value: Schema.String,
        kind: Schema.String,
      }),
      success: WorkAliasEntry,
      error: [WorkNotFound, AliasConflict, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("removeAlias", "/:id/aliases/:aliasId", {
      params: { id: Schema.String, aliasId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getChapters", "/:id/chapters", {
      params: { id: Schema.String },
      success: Schema.Array(WorkChapterEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("createChapter", "/:id/chapters", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.String,
        position: Schema.optional(Schema.Number),
        content: Schema.optional(PortableText),
      }),
      success: WorkChapterDetail,
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getChapter", "/chapters/:chapterId", {
      params: { chapterId: Schema.String },
      success: WorkChapterDetail,
      error: [ChapterNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.patch("updateChapter", "/chapters/:chapterId", {
      params: { chapterId: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        position: Schema.optional(Schema.Number),
        content: Schema.optional(Schema.NullOr(PortableText)),
      }),
      success: WorkChapterDetail,
      error: [ChapterNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("deleteChapter", "/chapters/:chapterId", {
      params: { chapterId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [ChapterNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.post("markChapterRead", "/chapters/:chapterId/read", {
      params: { chapterId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [ChapterNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("unmarkChapterRead", "/chapters/:chapterId/read", {
      params: { chapterId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [ChapterNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("getRequirements", "/:id/requirements", {
      params: { id: Schema.String },
      success: Schema.Array(WorkSystemRequirementEntry),
      error: [WorkNotFound, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.put("setRequirements", "/:id/requirements", {
      params: { id: Schema.String },
      payload: Schema.Array(
        Schema.Struct({
          platform: Schema.String,
          tier: Schema.String,
          os: Schema.optional(Schema.String),
          cpu: Schema.optional(Schema.String),
          memory: Schema.optional(Schema.String),
          graphics: Schema.optional(Schema.String),
          storage: Schema.optional(Schema.String),
          notes: Schema.optional(Schema.String),
        }),
      ),
      success: Schema.Array(WorkSystemRequirementEntry),
      error: [WorkNotFound, InvalidWorkPayload, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
  )
  .prefix("/works") {}
