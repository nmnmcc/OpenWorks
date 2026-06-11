import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { PortableText } from "../../../libraries/portable-text";
import { AuthMiddleware } from "./middlewares/auth";
import { Work } from "./works";

export class Creator extends Schema.Class<Creator>("Creator")({
  id: Schema.String,
  name: Schema.String,
  kind: Schema.String,
  bio: Schema.NullOr(PortableText),
  imageUrl: Schema.NullOr(Schema.String),
  createdById: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class CreatorRevisionEntry extends Schema.Class<CreatorRevisionEntry>("CreatorRevisionEntry")({
  id: Schema.String,
  creatorId: Schema.String,
  editedById: Schema.String,
  snapshot: Schema.Unknown,
  reason: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromString,
}) {}

export class CreatorWorksEntry extends Schema.Class<CreatorWorksEntry>("CreatorWorksEntry")({
  work: Work,
  roles: Schema.Array(Schema.String),
}) {}

export class CreatorNotFound extends Schema.TaggedErrorClass<CreatorNotFound>()(
  "CreatorNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class CreatorsGroup extends HttpApiGroup.make("creators")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        q: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(Creator),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Creator,
      error: [CreatorNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("getWorks", "/:id/works", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(CreatorWorksEntry),
      error: [CreatorNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        name: Schema.String,
        kind: Schema.Literals(["person", "organization"]),
        bio: Schema.optional(PortableText),
        imageUrl: Schema.optional(Schema.String),
      }),
      success: Creator,
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        name: Schema.optional(Schema.String),
        kind: Schema.optional(Schema.Literals(["person", "organization"])),
        bio: Schema.optional(Schema.NullOr(PortableText)),
        imageUrl: Schema.optional(Schema.NullOr(Schema.String)),
        reason: Schema.optional(Schema.String),
      }),
      success: Creator,
      error: [CreatorNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("getRevisions", "/:id/revisions", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(CreatorRevisionEntry),
      error: [CreatorNotFound, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/creators") {}
