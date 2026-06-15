import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware, OptionalAuthMiddleware, Unauthorized } from "./middlewares/auth";
import { Work } from "./works";

export class ShelfEntry extends Schema.Class<ShelfEntry>("ShelfEntry")({
  id: Schema.String,
  ownerId: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  isPublic: Schema.Boolean,
  itemCount: Schema.Number,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class ShelfItemEntry extends Schema.Class<ShelfItemEntry>("ShelfItemEntry")({
  id: Schema.String,
  shelfId: Schema.String,
  workId: Schema.String,
  note: Schema.NullOr(Schema.String),
  work: Work,
  createdAt: Schema.DateFromString,
}) {}

export class ShelfNotFound extends Schema.TaggedErrorClass<ShelfNotFound>()(
  "ShelfNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class ShelfForbidden extends Schema.TaggedErrorClass<ShelfForbidden>()(
  "ShelfForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class ShelfItemConflict extends Schema.TaggedErrorClass<ShelfItemConflict>()(
  "ShelfItemConflict",
  {},
  { httpApiStatus: 409 },
) {}

export class ShelfWorkNotFound extends Schema.TaggedErrorClass<ShelfWorkNotFound>()(
  "ShelfWorkNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class ShelvesGroup extends HttpApiGroup.make("shelves")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        ownerId: Schema.optional(Schema.String),
        workId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(ShelfEntry),
      error: [Unauthorized, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: ShelfEntry,
      error: [ShelfNotFound, ShelfForbidden, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.get("getItems", "/:id/items", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(ShelfItemEntry),
      error: [ShelfNotFound, ShelfForbidden, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        name: Schema.String,
        description: Schema.optional(Schema.String),
        isPublic: Schema.optional(Schema.Boolean),
      }),
      success: ShelfEntry,
      error: HttpApiError.InternalServerError,
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        name: Schema.optional(Schema.String),
        description: Schema.optional(Schema.NullOr(Schema.String)),
        isPublic: Schema.optional(Schema.Boolean),
      }),
      success: ShelfEntry,
      error: [ShelfNotFound, ShelfForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [ShelfNotFound, ShelfForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.post("addItem", "/:id/items", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        workId: Schema.String,
        note: Schema.optional(Schema.String),
      }),
      success: ShelfItemEntry,
      error: [ShelfNotFound, ShelfForbidden, ShelfItemConflict, ShelfWorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("removeItem", "/:id/items", {
      params: { id: Schema.String },
      query: {
        workId: Schema.String,
      },
      success: HttpApiSchema.NoContent,
      error: [ShelfNotFound, ShelfForbidden, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
  )
  .prefix("/shelves") {}
