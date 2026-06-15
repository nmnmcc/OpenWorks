import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware, OptionalAuthMiddleware, Unauthorized } from "./middlewares/auth";
import { Work } from "./works";

export class LibraryItemEntry extends Schema.Class<LibraryItemEntry>("LibraryItemEntry")({
  id: Schema.String,
  userId: Schema.String,
  workId: Schema.String,
  status: Schema.String,
  lastReadChapterId: Schema.NullOr(Schema.String),
  work: Work,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class LibraryItemNotFound extends Schema.TaggedErrorClass<LibraryItemNotFound>()(
  "LibraryItemNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class LibraryWorkNotFound extends Schema.TaggedErrorClass<LibraryWorkNotFound>()(
  "LibraryWorkNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class LibraryGroup extends HttpApiGroup.make("library")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        userId: Schema.optional(Schema.String),
        status: Schema.optional(Schema.String),
        workId: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(LibraryItemEntry),
      error: [Unauthorized, HttpApiError.InternalServerError],
    }).middleware(OptionalAuthMiddleware),
    HttpApiEndpoint.put("upsert", "/", {
      payload: Schema.Struct({
        workId: Schema.String,
        status: Schema.Literals(["want", "active", "completed", "on_hold", "dropped"]),
      }),
      success: LibraryItemEntry,
      error: [LibraryWorkNotFound, HttpApiError.InternalServerError],
    }).middleware(AuthMiddleware),
    HttpApiEndpoint.delete("remove", "/", {
      query: {
        workId: Schema.String,
      },
      success: HttpApiSchema.NoContent,
      error: HttpApiError.InternalServerError,
    }).middleware(AuthMiddleware),
  )
  .prefix("/library") {}
