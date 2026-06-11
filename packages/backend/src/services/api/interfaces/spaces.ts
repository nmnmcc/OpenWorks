import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class Space extends Schema.Class<Space>("Space")({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  description: Schema.NullOr(Schema.String),
  icon: Schema.NullOr(Schema.String),
  banner: Schema.NullOr(Schema.String),
  visibility: Schema.String,
  postingRestriction: Schema.String,
  nsfw: Schema.Boolean,
  memberCount: Schema.Number,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class SpaceMemberEntry extends Schema.Class<SpaceMemberEntry>("SpaceMemberEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class SpaceBanEntry extends Schema.Class<SpaceBanEntry>("SpaceBanEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  userId: Schema.String,
  reason: Schema.NullOr(Schema.String),
  bannedById: Schema.String,
  expiresAt: Schema.NullOr(Schema.DateFromString),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class SpaceMuteEntry extends Schema.Class<SpaceMuteEntry>("SpaceMuteEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  userId: Schema.String,
  reason: Schema.NullOr(Schema.String),
  mutedById: Schema.String,
  expiresAt: Schema.NullOr(Schema.DateFromString),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class SpaceInvitationEntry extends Schema.Class<SpaceInvitationEntry>("SpaceInvitationEntry")({
  id: Schema.String,
  spaceId: Schema.String,
  email: Schema.String,
  roleId: Schema.String,
  invitedById: Schema.String,
  status: Schema.String,
  token: Schema.String,
  expiresAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class SpaceSearchResult extends Schema.Class<SpaceSearchResult>("SpaceSearchResult")({
  hits: Schema.Array(Space),
  query: Schema.String,
  estimatedTotalHits: Schema.Number,
  processingTimeMs: Schema.Number,
  limit: Schema.Number,
  offset: Schema.Number,
}) {}

export class SpaceNotFound extends Schema.TaggedErrorClass<SpaceNotFound>()(
  "SpaceNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class SpaceForbidden extends Schema.TaggedErrorClass<SpaceForbidden>()(
  "SpaceForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class SpaceSlugConflict extends Schema.TaggedErrorClass<SpaceSlugConflict>()(
  "SpaceSlugConflict",
  {},
  { httpApiStatus: 409 },
) {}

export class AlreadyMember extends Schema.TaggedErrorClass<AlreadyMember>()(
  "AlreadyMember",
  {},
  { httpApiStatus: 409 },
) {}

export class NotMember extends Schema.TaggedErrorClass<NotMember>()("NotMember", {}, { httpApiStatus: 404 }) {}

export class UserBanned extends Schema.TaggedErrorClass<UserBanned>()("UserBanned", {}, { httpApiStatus: 403 }) {}

export class InvitationNotFound extends Schema.TaggedErrorClass<InvitationNotFound>()(
  "InvitationNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class InvitationInvalid extends Schema.TaggedErrorClass<InvitationInvalid>()(
  "InvitationInvalid",
  {},
  { httpApiStatus: 410 },
) {}

export class SpacesGroup extends HttpApiGroup.make("spaces")
  .add(
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: SpaceSearchResult,
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("list", "/", {
      query: {
        joined: Schema.optional(Schema.Literal("true")),
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(Space),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Space,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        name: Schema.String,
        slug: Schema.String,
        description: Schema.optional(Schema.String),
        visibility: Schema.optional(Schema.Literals(["public", "restricted", "private"])),
        nsfw: Schema.optional(Schema.Boolean),
      }),
      success: Space,
      error: [SpaceSlugConflict, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        name: Schema.optional(Schema.String),
        description: Schema.optional(Schema.String),
        icon: Schema.optional(Schema.NullOr(Schema.String)),
        banner: Schema.optional(Schema.NullOr(Schema.String)),
        visibility: Schema.optional(Schema.Literals(["public", "restricted", "private"])),
        postingRestriction: Schema.optional(Schema.Literals(["member", "moderator", "admin"])),
        nsfw: Schema.optional(Schema.Boolean),
      }),
      success: Space,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("join", "/:id/join", {
      params: { id: Schema.String },
      success: SpaceMemberEntry,
      error: [SpaceNotFound, SpaceForbidden, AlreadyMember, UserBanned, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("leave", "/:id/leave", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, NotMember, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("getMembership", "/:id/membership", {
      params: { id: Schema.String },
      success: Schema.NullOr(SpaceMemberEntry),
      error: [SpaceNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listMembers", "/:id/members", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(SpaceMemberEntry),
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("updateMember", "/:id/members/:memberId", {
      params: { id: Schema.String, memberId: Schema.String },
      payload: Schema.Struct({
        roleId: Schema.String,
      }),
      success: SpaceMemberEntry,
      error: [SpaceNotFound, NotMember, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("removeMember", "/:id/members/:memberId", {
      params: { id: Schema.String, memberId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, NotMember, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listBans", "/:id/bans", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(SpaceBanEntry),
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("ban", "/:id/bans", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        userId: Schema.String,
        reason: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: SpaceBanEntry,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unban", "/:id/bans/:banId", {
      params: { id: Schema.String, banId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listMutes", "/:id/mutes", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(SpaceMuteEntry),
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("mute", "/:id/mutes", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        userId: Schema.String,
        reason: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: SpaceMuteEntry,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unmute", "/:id/mutes/:muteId", {
      params: { id: Schema.String, muteId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listInvitations", "/:id/invitations", {
      params: { id: Schema.String },
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        offset: Schema.optional(Schema.NumberFromString),
      },
      success: Schema.Array(SpaceInvitationEntry),
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("createInvitation", "/:id/invitations", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        email: Schema.String,
        roleId: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: SpaceInvitationEntry,
      error: [SpaceNotFound, SpaceForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("revokeInvitation", "/:id/invitations/:invitationId", {
      params: { id: Schema.String, invitationId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [SpaceNotFound, SpaceForbidden, InvitationNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("acceptInvitation", "/invitations/accept", {
      payload: Schema.Struct({
        token: Schema.String,
      }),
      success: SpaceMemberEntry,
      error: [
        InvitationNotFound,
        InvitationInvalid,
        SpaceForbidden,
        AlreadyMember,
        UserBanned,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/spaces") {}
