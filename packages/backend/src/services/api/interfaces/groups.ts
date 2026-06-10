import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class Group extends Schema.Class<Group>("Group")({
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

export class GroupMemberEntry extends Schema.Class<GroupMemberEntry>("GroupMemberEntry")({
  id: Schema.String,
  groupId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class GroupBanEntry extends Schema.Class<GroupBanEntry>("GroupBanEntry")({
  id: Schema.String,
  groupId: Schema.String,
  userId: Schema.String,
  reason: Schema.NullOr(Schema.String),
  bannedById: Schema.String,
  expiresAt: Schema.NullOr(Schema.DateFromString),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class GroupMuteEntry extends Schema.Class<GroupMuteEntry>("GroupMuteEntry")({
  id: Schema.String,
  groupId: Schema.String,
  userId: Schema.String,
  reason: Schema.NullOr(Schema.String),
  mutedById: Schema.String,
  expiresAt: Schema.NullOr(Schema.DateFromString),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class GroupInvitationEntry extends Schema.Class<GroupInvitationEntry>("GroupInvitationEntry")({
  id: Schema.String,
  groupId: Schema.String,
  email: Schema.String,
  roleId: Schema.String,
  invitedById: Schema.String,
  status: Schema.String,
  token: Schema.String,
  expiresAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class GroupNotFound extends Schema.TaggedErrorClass<GroupNotFound>()(
  "GroupNotFound",
  {},
  { httpApiStatus: 404 },
) {}

export class GroupForbidden extends Schema.TaggedErrorClass<GroupForbidden>()(
  "GroupForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class GroupSlugConflict extends Schema.TaggedErrorClass<GroupSlugConflict>()(
  "GroupSlugConflict",
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

export class GroupsGroup extends HttpApiGroup.make("groups")
  .add(
    HttpApiEndpoint.get("list", "/", {
      success: Schema.Array(Group),
      error: HttpApiError.InternalServerError,
    }),
    HttpApiEndpoint.get("getById", "/:id", {
      params: { id: Schema.String },
      success: Group,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        name: Schema.String,
        slug: Schema.String,
        description: Schema.optional(Schema.String),
        visibility: Schema.optional(Schema.Literals(["public", "restricted", "private"])),
        nsfw: Schema.optional(Schema.Boolean),
      }),
      success: Group,
      error: [GroupSlugConflict, HttpApiError.InternalServerError],
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
      success: Group,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("join", "/:id/join", {
      params: { id: Schema.String },
      success: GroupMemberEntry,
      error: [GroupNotFound, GroupForbidden, AlreadyMember, UserBanned, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("leave", "/:id/leave", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, NotMember, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listMembers", "/:id/members", {
      params: { id: Schema.String },
      success: Schema.Array(GroupMemberEntry),
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("updateMember", "/:id/members/:memberId", {
      params: { id: Schema.String, memberId: Schema.String },
      payload: Schema.Struct({
        roleId: Schema.String,
      }),
      success: GroupMemberEntry,
      error: [GroupNotFound, NotMember, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("removeMember", "/:id/members/:memberId", {
      params: { id: Schema.String, memberId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, NotMember, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listBans", "/:id/bans", {
      params: { id: Schema.String },
      success: Schema.Array(GroupBanEntry),
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("ban", "/:id/bans", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        userId: Schema.String,
        reason: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: GroupBanEntry,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unban", "/:id/bans/:banId", {
      params: { id: Schema.String, banId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listMutes", "/:id/mutes", {
      params: { id: Schema.String },
      success: Schema.Array(GroupMuteEntry),
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("mute", "/:id/mutes", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        userId: Schema.String,
        reason: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: GroupMuteEntry,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("unmute", "/:id/mutes/:muteId", {
      params: { id: Schema.String, muteId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.get("listInvitations", "/:id/invitations", {
      params: { id: Schema.String },
      success: Schema.Array(GroupInvitationEntry),
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("createInvitation", "/:id/invitations", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        email: Schema.String,
        roleId: Schema.optional(Schema.String),
        expiresAt: Schema.optional(Schema.DateFromString),
      }),
      success: GroupInvitationEntry,
      error: [GroupNotFound, GroupForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("revokeInvitation", "/:id/invitations/:invitationId", {
      params: { id: Schema.String, invitationId: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [GroupNotFound, GroupForbidden, InvitationNotFound, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("acceptInvitation", "/invitations/accept", {
      payload: Schema.Struct({
        token: Schema.String,
      }),
      success: GroupMemberEntry,
      error: [
        InvitationNotFound,
        InvitationInvalid,
        GroupForbidden,
        AlreadyMember,
        UserBanned,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/groups") {}
