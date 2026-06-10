import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class WikiPageEntry extends Schema.Class<WikiPageEntry>("WikiPageEntry")({
  id: Schema.String,
  groupId: Schema.String,
  slug: Schema.String,
  title: Schema.String,
  content: Schema.String,
  lastEditedById: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class WikiRevisionEntry extends Schema.Class<WikiRevisionEntry>("WikiRevisionEntry")({
  id: Schema.String,
  pageId: Schema.String,
  content: Schema.String,
  editedById: Schema.String,
  reason: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
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
    HttpApiEndpoint.get("listPages", "/pages", {
      query: {
        groupId: Schema.String,
      },
      success: Schema.Array(WikiPageEntry),
      error: [WikiForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("getPage", "/pages/:id", {
      params: { id: Schema.String },
      success: WikiPageEntry,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("createPage", "/pages", {
      payload: Schema.Struct({
        groupId: Schema.String,
        slug: Schema.String,
        title: Schema.String,
        content: Schema.String,
      }),
      success: WikiPageEntry,
      error: [WikiForbidden, WikiSlugConflict, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("updatePage", "/pages/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        content: Schema.optional(Schema.String),
        reason: Schema.optional(Schema.String),
      }),
      success: WikiPageEntry,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("deletePage", "/pages/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listRevisions", "/pages/:id/revisions", {
      params: { id: Schema.String },
      success: Schema.Array(WikiRevisionEntry),
      error: [WikiPageNotFound, WikiForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/wiki") {}
