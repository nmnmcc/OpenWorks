import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { PortableText } from "../../../libraries/portable-text";
import { AuthMiddleware, OptionalAuthMiddleware } from "./middlewares/auth";

export class WikiPageEntry extends Schema.Class<WikiPageEntry>("WikiPageEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  slug: Schema.String,
  title: Schema.String,
  content: PortableText,
  lastEditedById: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class WikiRevisionEntry extends Schema.Class<WikiRevisionEntry>("WikiRevisionEntry")({
  id: Schema.String,
  pageId: Schema.String,
  content: PortableText,
  editedById: Schema.String,
  reason: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class WikiPageSearchResult extends Schema.Class<WikiPageSearchResult>("WikiPageSearchResult")({
  hits: Schema.Array(WikiPageEntry),
  query: Schema.String,
  estimatedTotalHits: Schema.Number,
  processingTimeMs: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}) {}

export class WikiPageNotFound extends Schema.TaggedErrorClass<WikiPageNotFound>()(
  "WikiPageNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class WikiForbidden extends Schema.TaggedErrorClass<WikiForbidden>()(
  "WikiForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class WikiSlugConflict extends Schema.TaggedErrorClass<WikiSlugConflict>()(
  "WikiSlugConflict",
  {},
  { httpApiStatus: 409 },
) {}

export class WikiGroup extends HttpApiGroup.make("wiki")
  .add(
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        spaceId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: WikiPageSearchResult,
      error: HttpApiError.InternalServerError,
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("listPages", "/pages", {
      query: {
        spaceId: Schema.String,
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(WikiPageEntry),
      error: [WikiForbidden, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getPage", "/pages/:id", {
      params: { id: Schema.String },
      success: WikiPageEntry,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("createPage", "/pages", {
      payload: Schema.Struct({
        spaceId: Schema.String,
        slug: Schema.String,
        title: Schema.String,
        content: PortableText,
      }),
      success: WikiPageEntry,
      error: [WikiForbidden, WikiSlugConflict, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.patch("updatePage", "/pages/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        content: Schema.optional(PortableText),
        reason: Schema.optional(Schema.String),
      }),
      success: WikiPageEntry,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("deletePage", "/pages/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.get("listRevisions", "/pages/:id/revisions", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(WikiRevisionEntry),
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
  )
  .prefix("/wiki") {}
