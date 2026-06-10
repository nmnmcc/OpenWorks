import { randomBytes } from "node:crypto";
import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, and, sql } from "drizzle-orm";
import {
  Api,
  Group,
  GroupMemberEntry,
  GroupBanEntry,
  GroupMuteEntry,
  GroupInvitationEntry,
  GroupNotFound,
  GroupForbidden,
  GroupSlugConflict,
  AlreadyMember,
  NotMember,
  UserBanned,
  InvitationNotFound,
  InvitationInvalid,
  CurrentUser,
} from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import {
  groups,
  roles,
  permissions,
  rolePermissions,
  groupMembers,
  groupBans,
  groupMutes,
  groupInvitations,
  modLog,
} from "../../database/schema";

export const GroupsHandlers = HttpApiBuilder.group(
  Api,
  "groups",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.groups.findMany({
            where: {
              OR: [{ visibility: { ne: "private" } }, { members: { userId: user.id } }],
            },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new Group(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const row = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new GroupNotFound();
          }
          if (row.visibility === "private") {
            const membership = yield* database.query.groupMembers.findFirst({
              where: {
                groupId: row.id,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new GroupForbidden();
            }
          }
          return new Group(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const groupId = v7();

          const existing = yield* database.query.groups.findFirst({
            where: { slug: payload.slug },
          });
          if (existing) {
            return yield* new GroupSlugConflict();
          }

          const [group] = yield* database
            .insert(groups)
            .values({
              id: groupId,
              name: payload.name,
              slug: payload.slug,
              description: payload.description,
              visibility: payload.visibility ?? "public",
              nsfw: payload.nsfw ?? false,
              memberCount: 1,
            })
            .returning();

          const manageAll = {
            id: v7(),
            action: "manage",
            subject: "all",
            inverted: false,
          };
          const managePost = {
            id: v7(),
            action: "manage",
            subject: "Post",
            inverted: false,
          };
          const manageComment = {
            id: v7(),
            action: "manage",
            subject: "Comment",
            inverted: false,
          };
          const manageGroupMember = {
            id: v7(),
            action: "manage",
            subject: "GroupMember",
            inverted: false,
          };
          const manageGroupBan = {
            id: v7(),
            action: "manage",
            subject: "GroupBan",
            inverted: false,
          };
          const manageGroupMute = {
            id: v7(),
            action: "manage",
            subject: "GroupMute",
            inverted: false,
          };
          const createPost = {
            id: v7(),
            action: "create",
            subject: "Post",
            inverted: false,
          };
          const readPost = {
            id: v7(),
            action: "read",
            subject: "Post",
            inverted: false,
          };
          const updateOwnPost = {
            id: v7(),
            action: "update",
            subject: "Post",
            conditions: { authorId: "${user.id}" },
            inverted: false,
          };
          const deleteOwnPost = {
            id: v7(),
            action: "delete",
            subject: "Post",
            conditions: { authorId: "${user.id}" },
            inverted: false,
          };
          const createComment = {
            id: v7(),
            action: "create",
            subject: "Comment",
            inverted: false,
          };
          const readComment = {
            id: v7(),
            action: "read",
            subject: "Comment",
            inverted: false,
          };
          const updateOwnComment = {
            id: v7(),
            action: "update",
            subject: "Comment",
            conditions: { authorId: "${user.id}" },
            inverted: false,
          };
          const deleteOwnComment = {
            id: v7(),
            action: "delete",
            subject: "Comment",
            conditions: { authorId: "${user.id}" },
            inverted: false,
          };
          const createVote = {
            id: v7(),
            action: "create",
            subject: "Vote",
            inverted: false,
          };
          const readVote = {
            id: v7(),
            action: "read",
            subject: "Vote",
            inverted: false,
          };
          const deleteOwnVote = {
            id: v7(),
            action: "delete",
            subject: "Vote",
            conditions: { userId: "${user.id}" },
            inverted: false,
          };
          const readGroup = {
            id: v7(),
            action: "read",
            subject: "Group",
            inverted: false,
          };
          const updateGroupPerm = {
            id: v7(),
            action: "update",
            subject: "Group",
            inverted: false,
          };
          const readGroupMember = {
            id: v7(),
            action: "read",
            subject: "GroupMember",
            inverted: false,
          };
          const readGroupBan = {
            id: v7(),
            action: "read",
            subject: "GroupBan",
            inverted: false,
          };
          const manageReport = {
            id: v7(),
            action: "manage",
            subject: "Report",
            inverted: false,
          };
          const managePostFlair = {
            id: v7(),
            action: "manage",
            subject: "PostFlair",
            inverted: false,
          };
          const manageUserFlair = {
            id: v7(),
            action: "manage",
            subject: "UserFlair",
            inverted: false,
          };
          const manageGroupRule = {
            id: v7(),
            action: "manage",
            subject: "GroupRule",
            inverted: false,
          };
          const manageWikiPage = {
            id: v7(),
            action: "manage",
            subject: "WikiPage",
            inverted: false,
          };
          const readWikiPage = {
            id: v7(),
            action: "read",
            subject: "WikiPage",
            inverted: false,
          };
          const readModLog = {
            id: v7(),
            action: "read",
            subject: "ModLog",
            inverted: false,
          };

          yield* database
            .insert(permissions)
            .values([
              manageAll,
              managePost,
              manageComment,
              manageGroupMember,
              manageGroupBan,
              manageGroupMute,
              createPost,
              readPost,
              updateOwnPost,
              deleteOwnPost,
              createComment,
              readComment,
              updateOwnComment,
              deleteOwnComment,
              createVote,
              readVote,
              deleteOwnVote,
              readGroup,
              updateGroupPerm,
              readGroupMember,
              readGroupBan,
              manageReport,
              managePostFlair,
              manageUserFlair,
              manageGroupRule,
              manageWikiPage,
              readWikiPage,
              readModLog,
            ]);

          const adminRole = {
            id: v7(),
            name: "admin",
            description: "Full access",
            groupId,
            isDefault: false,
          };
          const modRole = {
            id: v7(),
            name: "moderator",
            description: "Moderation access",
            groupId,
            isDefault: false,
          };
          const memberRole = {
            id: v7(),
            name: "member",
            description: "Standard member",
            groupId,
            isDefault: true,
          };
          const viewerRole = {
            id: v7(),
            name: "viewer",
            description: "Read-only access",
            groupId,
            isDefault: false,
          };

          yield* database.insert(roles).values([adminRole, modRole, memberRole, viewerRole]);

          yield* database.insert(rolePermissions).values([
            { roleId: adminRole.id, permissionId: manageAll.id },
            { roleId: modRole.id, permissionId: managePost.id },
            { roleId: modRole.id, permissionId: manageComment.id },
            {
              roleId: modRole.id,
              permissionId: manageGroupMember.id,
            },
            { roleId: modRole.id, permissionId: manageGroupBan.id },
            {
              roleId: modRole.id,
              permissionId: manageGroupMute.id,
            },
            { roleId: modRole.id, permissionId: readGroup.id },
            {
              roleId: modRole.id,
              permissionId: updateGroupPerm.id,
            },
            {
              roleId: modRole.id,
              permissionId: readGroupMember.id,
            },
            { roleId: modRole.id, permissionId: readGroupBan.id },
            { roleId: modRole.id, permissionId: manageReport.id },
            {
              roleId: modRole.id,
              permissionId: managePostFlair.id,
            },
            {
              roleId: modRole.id,
              permissionId: manageUserFlair.id,
            },
            {
              roleId: modRole.id,
              permissionId: manageGroupRule.id,
            },
            {
              roleId: modRole.id,
              permissionId: manageWikiPage.id,
            },
            { roleId: modRole.id, permissionId: readModLog.id },
            { roleId: memberRole.id, permissionId: createPost.id },
            { roleId: memberRole.id, permissionId: readPost.id },
            {
              roleId: memberRole.id,
              permissionId: updateOwnPost.id,
            },
            {
              roleId: memberRole.id,
              permissionId: deleteOwnPost.id,
            },
            {
              roleId: memberRole.id,
              permissionId: createComment.id,
            },
            { roleId: memberRole.id, permissionId: readComment.id },
            {
              roleId: memberRole.id,
              permissionId: updateOwnComment.id,
            },
            {
              roleId: memberRole.id,
              permissionId: deleteOwnComment.id,
            },
            { roleId: memberRole.id, permissionId: createVote.id },
            { roleId: memberRole.id, permissionId: readVote.id },
            {
              roleId: memberRole.id,
              permissionId: deleteOwnVote.id,
            },
            { roleId: memberRole.id, permissionId: readGroup.id },
            {
              roleId: memberRole.id,
              permissionId: readGroupMember.id,
            },
            {
              roleId: memberRole.id,
              permissionId: readWikiPage.id,
            },
            { roleId: viewerRole.id, permissionId: readPost.id },
            { roleId: viewerRole.id, permissionId: readComment.id },
            { roleId: viewerRole.id, permissionId: readVote.id },
            { roleId: viewerRole.id, permissionId: readGroup.id },
            {
              roleId: viewerRole.id,
              permissionId: readGroupMember.id,
            },
            {
              roleId: viewerRole.id,
              permissionId: readWikiPage.id,
            },
          ]);

          yield* database.insert(groupMembers).values({
            id: v7(),
            groupId,
            userId: user.id,
            roleId: adminRole.id,
          });

          return new Group(group!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "update",
            subject: "Group",
          });
          const [updated] = yield* database
            .update(groups)
            .set({
              name: payload.name,
              description: payload.description,
              icon: payload.icon,
              banner: payload.banner,
              visibility: payload.visibility,
              postingRestriction: payload.postingRestriction,
              nsfw: payload.nsfw,
            })
            .where(eq(groups.id, params.id))
            .returning();
          return new Group(updated!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "Group",
          });
          yield* database.delete(groups).where(eq(groups.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("join", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          if (group.visibility === "private") {
            return yield* new GroupForbidden();
          }
          const existingMember = yield* database.query.groupMembers.findFirst({
            where: {
              groupId: params.id,
              userId: user.id,
            },
          });
          if (existingMember) {
            return yield* new AlreadyMember();
          }
          const ban = yield* database.query.groupBans.findFirst({
            where: {
              groupId: params.id,
              userId: user.id,
            },
          });
          if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
            return yield* new UserBanned();
          }
          const defaultRole = yield* database.query.roles.findFirst({
            where: {
              groupId: params.id,
              isDefault: true,
            },
          });
          if (!defaultRole) {
            return yield* new HttpApiError.InternalServerError();
          }
          const [member] = yield* database
            .insert(groupMembers)
            .values({
              id: v7(),
              groupId: params.id,
              userId: user.id,
              roleId: defaultRole.id,
            })
            .returning();
          yield* database
            .update(groups)
            .set({
              memberCount: sql`${groups.memberCount} + 1`,
            })
            .where(eq(groups.id, params.id));
          return new GroupMemberEntry(member!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("leave", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          const rows = yield* database
            .delete(groupMembers)
            .where(and(eq(groupMembers.groupId, params.id), eq(groupMembers.userId, user.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database
            .update(groups)
            .set({
              memberCount: sql`greatest(${groups.memberCount} - 1, 0)`,
            })
            .where(eq(groups.id, params.id));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("listMembers", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "GroupMember",
          });
          const rows = yield* database.query.groupMembers.findMany({
            where: { groupId: params.id },
            orderBy: { createdAt: "asc" },
          });
          return rows.map((row) => new GroupMemberEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("updateMember", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMember",
          });
          const rows = yield* database
            .update(groupMembers)
            .set({ roleId: payload.roleId })
            .where(and(eq(groupMembers.id, params.memberId), eq(groupMembers.groupId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: params.id,
            moderatorId: user.id,
            action: "member_role_update",
            targetType: "user",
            targetId: rows[0]!.userId,
            details: { roleId: payload.roleId },
          });
          return new GroupMemberEntry(rows[0]!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("removeMember", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMember",
          });
          const rows = yield* database
            .delete(groupMembers)
            .where(and(eq(groupMembers.id, params.memberId), eq(groupMembers.groupId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database
            .update(groups)
            .set({
              memberCount: sql`greatest(${groups.memberCount} - 1, 0)`,
            })
            .where(eq(groups.id, params.id));
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: params.id,
            moderatorId: user.id,
            action: "member_remove",
            targetType: "user",
            targetId: rows[0]!.userId,
          });
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listBans", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "GroupBan",
          });
          const rows = yield* database.query.groupBans.findMany({
            where: { groupId: params.id },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new GroupBanEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("ban", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupBan",
          });
          const removedMembers = yield* database
            .delete(groupMembers)
            .where(and(eq(groupMembers.groupId, params.id), eq(groupMembers.userId, payload.userId)))
            .returning();
          if (removedMembers.length > 0) {
            yield* database
              .update(groups)
              .set({
                memberCount: sql`greatest(${groups.memberCount} - 1, 0)`,
              })
              .where(eq(groups.id, params.id));
          }
          const existingBan = yield* database.query.groupBans.findFirst({
            where: {
              groupId: params.id,
              userId: payload.userId,
            },
          });
          const [ban] = existingBan
            ? yield* database
                .update(groupBans)
                .set({
                  reason: payload.reason,
                  expiresAt: payload.expiresAt ?? null,
                  bannedById: user.id,
                })
                .where(eq(groupBans.id, existingBan.id))
                .returning()
            : yield* database
                .insert(groupBans)
                .values({
                  id: v7(),
                  groupId: params.id,
                  userId: payload.userId,
                  reason: payload.reason,
                  expiresAt: payload.expiresAt,
                  bannedById: user.id,
                })
                .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: params.id,
            moderatorId: user.id,
            action: "user_ban",
            targetType: "user",
            targetId: payload.userId,
            details: {
              reason: payload.reason ?? null,
              expiresAt: payload.expiresAt?.toISOString() ?? null,
            },
          });
          return new GroupBanEntry(ban!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("unban", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupBan",
          });
          const removedBans = yield* database
            .delete(groupBans)
            .where(and(eq(groupBans.id, params.banId), eq(groupBans.groupId, params.id)))
            .returning();
          if (removedBans.length > 0) {
            yield* database.insert(modLog).values({
              id: v7(),
              groupId: params.id,
              moderatorId: user.id,
              action: "user_unban",
              targetType: "user",
              targetId: removedBans[0]!.userId,
            });
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listMutes", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "GroupMute",
          });
          const rows = yield* database.query.groupMutes.findMany({
            where: { groupId: params.id },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new GroupMuteEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("mute", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMute",
          });
          const existing = yield* database.query.groupMutes.findFirst({
            where: {
              groupId: params.id,
              userId: payload.userId,
            },
          });
          const [mute] = existing
            ? yield* database
                .update(groupMutes)
                .set({
                  reason: payload.reason,
                  expiresAt: payload.expiresAt ?? null,
                  mutedById: user.id,
                })
                .where(eq(groupMutes.id, existing.id))
                .returning()
            : yield* database
                .insert(groupMutes)
                .values({
                  id: v7(),
                  groupId: params.id,
                  userId: payload.userId,
                  reason: payload.reason,
                  expiresAt: payload.expiresAt,
                  mutedById: user.id,
                })
                .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: params.id,
            moderatorId: user.id,
            action: "user_mute",
            targetType: "user",
            targetId: payload.userId,
            details: {
              reason: payload.reason ?? null,
              expiresAt: payload.expiresAt?.toISOString() ?? null,
            },
          });
          return new GroupMuteEntry(mute!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("unmute", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMute",
          });
          const removedMutes = yield* database
            .delete(groupMutes)
            .where(and(eq(groupMutes.id, params.muteId), eq(groupMutes.groupId, params.id)))
            .returning();
          if (removedMutes.length > 0) {
            yield* database.insert(modLog).values({
              id: v7(),
              groupId: params.id,
              moderatorId: user.id,
              action: "user_unmute",
              targetType: "user",
              targetId: removedMutes[0]!.userId,
            });
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listInvitations", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMember",
          });
          const rows = yield* database.query.groupInvitations.findMany({
            where: { groupId: params.id },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new GroupInvitationEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("createInvitation", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMember",
          });
          const role = payload.roleId
            ? yield* database.query.roles.findFirst({
                where: {
                  id: payload.roleId,
                  groupId: params.id,
                },
              })
            : yield* database.query.roles.findFirst({
                where: {
                  groupId: params.id,
                  isDefault: true,
                },
              });
          if (!role) {
            return yield* new HttpApiError.InternalServerError();
          }
          const [invitation] = yield* database
            .insert(groupInvitations)
            .values({
              id: v7(),
              groupId: params.id,
              email: payload.email,
              roleId: role.id,
              invitedById: user.id,
              token: randomBytes(32).toString("hex"),
              expiresAt: payload.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })
            .returning();
          return new GroupInvitationEntry(invitation!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("revokeInvitation", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const group = yield* database.query.groups.findFirst({
            where: { id: params.id },
          });
          if (!group) {
            return yield* new GroupNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "GroupMember",
          });
          const rows = yield* database
            .delete(groupInvitations)
            .where(and(eq(groupInvitations.id, params.invitationId), eq(groupInvitations.groupId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new InvitationNotFound();
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new GroupForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("acceptInvitation", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const invitation = yield* database.query.groupInvitations.findFirst({
            where: { token: payload.token },
          });
          if (!invitation) {
            return yield* new InvitationNotFound();
          }
          if (invitation.status !== "pending") {
            return yield* new InvitationInvalid();
          }
          if (invitation.expiresAt <= new Date()) {
            yield* database
              .update(groupInvitations)
              .set({ status: "expired" })
              .where(eq(groupInvitations.id, invitation.id));
            return yield* new InvitationInvalid();
          }
          if (invitation.email !== user.email) {
            return yield* new GroupForbidden();
          }
          const existingMember = yield* database.query.groupMembers.findFirst({
            where: {
              groupId: invitation.groupId,
              userId: user.id,
            },
          });
          if (existingMember) {
            return yield* new AlreadyMember();
          }
          const ban = yield* database.query.groupBans.findFirst({
            where: {
              groupId: invitation.groupId,
              userId: user.id,
            },
          });
          if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
            return yield* new UserBanned();
          }
          const [member] = yield* database
            .insert(groupMembers)
            .values({
              id: v7(),
              groupId: invitation.groupId,
              userId: user.id,
              roleId: invitation.roleId,
            })
            .returning();
          yield* database
            .update(groupInvitations)
            .set({ status: "accepted" })
            .where(eq(groupInvitations.id, invitation.id));
          yield* database
            .update(groups)
            .set({
              memberCount: sql`${groups.memberCount} + 1`,
            })
            .where(eq(groups.id, invitation.groupId));
          return new GroupMemberEntry(member!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
