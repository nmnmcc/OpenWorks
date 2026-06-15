import { randomBytes } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import { Effect, Option } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { modLog } from "../../database/schema/moderation-log";
import {
  permissions,
  rolePermissions,
  roles,
  spaceBans,
  spaceInvitations,
  spaceMembers,
  spaceMutes,
  spaces,
} from "../../database/schema/space";
import { spaceWorks } from "../../database/schema/space-work";
import { Search } from "../../search";
import { Api } from "../interfaces";
import { CurrentUser, CurrentUserOption } from "../interfaces/middlewares/auth";
import {
  AlreadyMember,
  InvitationInvalid,
  InvitationNotFound,
  NotMember,
  Space,
  SpaceBanEntry,
  SpaceForbidden,
  SpaceInvitationEntry,
  SpaceMemberEntry,
  SpaceMuteEntry,
  SpaceNotFound,
  SpaceSearchResult,
  SpaceSlugConflict,
  SpaceWorkConflict,
  SpaceWorkEntry,
  SpaceWorkNotFound,
  UserBanned,
} from "../interfaces/spaces";
import { Work } from "../interfaces/works";

export const SpacesHandlers = HttpApiBuilder.group(
  Api,
  "spaces",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const authorization = yield* Authorization;
    const search = yield* Search;

    return handlers
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchSpaces({ q: query.q, limit, offset });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new SpaceSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.spaces.findMany({
            where: {
              id: { in: ids },
              OR:
                userId === undefined
                  ? [{ visibility: { ne: "private" } }]
                  : [{ visibility: { ne: "private" } }, { members: { userId } }],
            },
          });

          const rowMap = new Map(rows.map((row) => [row.id, row]));
          const hits = ids
            .map((id) => rowMap.get(id))
            .filter((row): row is (typeof rows)[number] => row !== undefined)
            .map((row) => new Space(row));

          return new SpaceSearchResult({
            hits,
            query: result.query,
            estimatedTotalHits: result.estimatedTotalHits ?? 0,
            processingTimeMs: result.processingTimeMs,
            limit,
            offset,
          });
        }).pipe(
          Effect.catchTag("UnknownError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          if (query.joined === "true" && userId === undefined) {
            return [];
          }
          const rows = yield* database.query.spaces.findMany({
            where:
              query.joined === "true" && userId !== undefined
                ? { members: { userId } }
                : {
                    OR:
                      userId === undefined
                        ? [{ visibility: { ne: "private" } }]
                        : [{ visibility: { ne: "private" } }, { members: { userId } }],
                  },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new Space(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const row = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new SpaceNotFound();
          }
          if (row.visibility === "private") {
            const membership =
              userId === undefined
                ? undefined
                : yield* database.query.spaceMembers.findFirst({
                    where: {
                      spaceId: row.id,
                      userId,
                    },
                  });
            if (!membership) {
              return yield* new SpaceForbidden();
            }
          }
          return new Space(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const spaceId = v7();

          const existing = yield* database.query.spaces.findFirst({
            where: { slug: payload.slug },
          });
          if (existing) {
            return yield* new SpaceSlugConflict();
          }

          const [space] = yield* database
            .insert(spaces)
            .values({
              id: spaceId,
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
          const manageSpaceMember = {
            id: v7(),
            action: "manage",
            subject: "SpaceMember",
            inverted: false,
          };
          const manageSpaceBan = {
            id: v7(),
            action: "manage",
            subject: "SpaceBan",
            inverted: false,
          };
          const manageSpaceMute = {
            id: v7(),
            action: "manage",
            subject: "SpaceMute",
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
          const readSpace = {
            id: v7(),
            action: "read",
            subject: "Space",
            inverted: false,
          };
          const updateSpacePerm = {
            id: v7(),
            action: "update",
            subject: "Space",
            inverted: false,
          };
          const readSpaceMember = {
            id: v7(),
            action: "read",
            subject: "SpaceMember",
            inverted: false,
          };
          const readSpaceBan = {
            id: v7(),
            action: "read",
            subject: "SpaceBan",
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
          const manageSpaceRule = {
            id: v7(),
            action: "manage",
            subject: "SpaceRule",
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
              manageSpaceMember,
              manageSpaceBan,
              manageSpaceMute,
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
              readSpace,
              updateSpacePerm,
              readSpaceMember,
              readSpaceBan,
              manageReport,
              managePostFlair,
              manageUserFlair,
              manageSpaceRule,
              manageWikiPage,
              readWikiPage,
              readModLog,
            ]);

          const adminRole = {
            id: v7(),
            name: "admin",
            description: "Full access",
            spaceId,
            isDefault: false,
          };
          const modRole = {
            id: v7(),
            name: "moderator",
            description: "Moderation access",
            spaceId,
            isDefault: false,
          };
          const memberRole = {
            id: v7(),
            name: "member",
            description: "Standard member",
            spaceId,
            isDefault: true,
          };
          const viewerRole = {
            id: v7(),
            name: "viewer",
            description: "Read-only access",
            spaceId,
            isDefault: false,
          };

          yield* database.insert(roles).values([adminRole, modRole, memberRole, viewerRole]);

          yield* database.insert(rolePermissions).values([
            { roleId: adminRole.id, permissionId: manageAll.id },
            { roleId: modRole.id, permissionId: managePost.id },
            { roleId: modRole.id, permissionId: manageComment.id },
            {
              roleId: modRole.id,
              permissionId: manageSpaceMember.id,
            },
            { roleId: modRole.id, permissionId: manageSpaceBan.id },
            {
              roleId: modRole.id,
              permissionId: manageSpaceMute.id,
            },
            { roleId: modRole.id, permissionId: readSpace.id },
            {
              roleId: modRole.id,
              permissionId: updateSpacePerm.id,
            },
            {
              roleId: modRole.id,
              permissionId: readSpaceMember.id,
            },
            { roleId: modRole.id, permissionId: readSpaceBan.id },
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
              permissionId: manageSpaceRule.id,
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
            { roleId: memberRole.id, permissionId: readSpace.id },
            {
              roleId: memberRole.id,
              permissionId: readSpaceMember.id,
            },
            {
              roleId: memberRole.id,
              permissionId: readWikiPage.id,
            },
            { roleId: viewerRole.id, permissionId: readPost.id },
            { roleId: viewerRole.id, permissionId: readComment.id },
            { roleId: viewerRole.id, permissionId: readVote.id },
            { roleId: viewerRole.id, permissionId: readSpace.id },
            {
              roleId: viewerRole.id,
              permissionId: readSpaceMember.id,
            },
            {
              roleId: viewerRole.id,
              permissionId: readWikiPage.id,
            },
          ]);

          yield* database.insert(spaceMembers).values({
            id: v7(),
            spaceId,
            userId: user.id,
            roleId: adminRole.id,
          });

          return new Space(space!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "update",
            subject: "Space",
          });
          const [updated] = yield* database
            .update(spaces)
            .set({
              name: payload.name,
              description: payload.description,
              icon: payload.icon,
              banner: payload.banner,
              visibility: payload.visibility,
              postingRestriction: payload.postingRestriction,
              nsfw: payload.nsfw,
            })
            .where(eq(spaces.id, params.id))
            .returning();
          return new Space(updated!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "Space",
          });
          yield* database.delete(spaces).where(eq(spaces.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          if (space.visibility === "private") {
            return yield* new SpaceForbidden();
          }
          const existingMember = yield* database.query.spaceMembers.findFirst({
            where: {
              spaceId: params.id,
              userId: user.id,
            },
          });
          if (existingMember) {
            return yield* new AlreadyMember();
          }
          const ban = yield* database.query.spaceBans.findFirst({
            where: {
              spaceId: params.id,
              userId: user.id,
            },
          });
          if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
            return yield* new UserBanned();
          }
          const defaultRole = yield* database.query.roles.findFirst({
            where: {
              spaceId: params.id,
              isDefault: true,
            },
          });
          if (!defaultRole) {
            return yield* new HttpApiError.InternalServerError();
          }
          const [member] = yield* database
            .insert(spaceMembers)
            .values({
              id: v7(),
              spaceId: params.id,
              userId: user.id,
              roleId: defaultRole.id,
            })
            .returning();
          yield* database
            .update(spaces)
            .set({
              memberCount: sql`${spaces.memberCount} + 1`,
            })
            .where(eq(spaces.id, params.id));
          return new SpaceMemberEntry(member!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("leave", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          const rows = yield* database
            .delete(spaceMembers)
            .where(and(eq(spaceMembers.spaceId, params.id), eq(spaceMembers.userId, user.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database
            .update(spaces)
            .set({
              memberCount: sql`greatest(${spaces.memberCount} - 1, 0)`,
            })
            .where(eq(spaces.id, params.id));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getMembership", ({ params }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          const member =
            userId === undefined
              ? undefined
              : yield* database.query.spaceMembers.findFirst({
                  where: {
                    spaceId: params.id,
                    userId,
                  },
                });
          return member ? new SpaceMemberEntry(member) : null;
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("listMembers", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "SpaceMember",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.spaceMembers.findMany({
            where: { spaceId: params.id },
            orderBy: { createdAt: "asc" },
            limit,
            offset,
          });
          return rows.map((row) => new SpaceMemberEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMember",
          });
          const rows = yield* database
            .update(spaceMembers)
            .set({ roleId: payload.roleId })
            .where(and(eq(spaceMembers.id, params.memberId), eq(spaceMembers.spaceId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "member_role_update",
            targetType: "user",
            targetId: rows[0]!.userId,
            details: { roleId: payload.roleId },
          });
          return new SpaceMemberEntry(rows[0]!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMember",
          });
          const rows = yield* database
            .delete(spaceMembers)
            .where(and(eq(spaceMembers.id, params.memberId), eq(spaceMembers.spaceId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new NotMember();
          }
          yield* database
            .update(spaces)
            .set({
              memberCount: sql`greatest(${spaces.memberCount} - 1, 0)`,
            })
            .where(eq(spaces.id, params.id));
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "member_remove",
            targetType: "user",
            targetId: rows[0]!.userId,
          });
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listBans", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "SpaceBan",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.spaceBans.findMany({
            where: { spaceId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new SpaceBanEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceBan",
          });
          const removedMembers = yield* database
            .delete(spaceMembers)
            .where(and(eq(spaceMembers.spaceId, params.id), eq(spaceMembers.userId, payload.userId)))
            .returning();
          if (removedMembers.length > 0) {
            yield* database
              .update(spaces)
              .set({
                memberCount: sql`greatest(${spaces.memberCount} - 1, 0)`,
              })
              .where(eq(spaces.id, params.id));
          }
          const existingBan = yield* database.query.spaceBans.findFirst({
            where: {
              spaceId: params.id,
              userId: payload.userId,
            },
          });
          const [ban] = existingBan
            ? yield* database
                .update(spaceBans)
                .set({
                  reason: payload.reason,
                  expiresAt: payload.expiresAt ?? null,
                  bannedById: user.id,
                })
                .where(eq(spaceBans.id, existingBan.id))
                .returning()
            : yield* database
                .insert(spaceBans)
                .values({
                  id: v7(),
                  spaceId: params.id,
                  userId: payload.userId,
                  reason: payload.reason,
                  expiresAt: payload.expiresAt,
                  bannedById: user.id,
                })
                .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "user_ban",
            targetType: "user",
            targetId: payload.userId,
            details: {
              reason: payload.reason ?? null,
              expiresAt: payload.expiresAt?.toISOString() ?? null,
            },
          });
          return new SpaceBanEntry(ban!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceBan",
          });
          const removedBans = yield* database
            .delete(spaceBans)
            .where(and(eq(spaceBans.id, params.banId), eq(spaceBans.spaceId, params.id)))
            .returning();
          if (removedBans.length > 0) {
            yield* database.insert(modLog).values({
              id: v7(),
              spaceId: params.id,
              moderatorId: user.id,
              action: "user_unban",
              targetType: "user",
              targetId: removedBans[0]!.userId,
            });
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listMutes", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "read",
            subject: "SpaceMute",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.spaceMutes.findMany({
            where: { spaceId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new SpaceMuteEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMute",
          });
          const existing = yield* database.query.spaceMutes.findFirst({
            where: {
              spaceId: params.id,
              userId: payload.userId,
            },
          });
          const [mute] = existing
            ? yield* database
                .update(spaceMutes)
                .set({
                  reason: payload.reason,
                  expiresAt: payload.expiresAt ?? null,
                  mutedById: user.id,
                })
                .where(eq(spaceMutes.id, existing.id))
                .returning()
            : yield* database
                .insert(spaceMutes)
                .values({
                  id: v7(),
                  spaceId: params.id,
                  userId: payload.userId,
                  reason: payload.reason,
                  expiresAt: payload.expiresAt,
                  mutedById: user.id,
                })
                .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "user_mute",
            targetType: "user",
            targetId: payload.userId,
            details: {
              reason: payload.reason ?? null,
              expiresAt: payload.expiresAt?.toISOString() ?? null,
            },
          });
          return new SpaceMuteEntry(mute!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMute",
          });
          const removedMutes = yield* database
            .delete(spaceMutes)
            .where(and(eq(spaceMutes.id, params.muteId), eq(spaceMutes.spaceId, params.id)))
            .returning();
          if (removedMutes.length > 0) {
            yield* database.insert(modLog).values({
              id: v7(),
              spaceId: params.id,
              moderatorId: user.id,
              action: "user_unmute",
              targetType: "user",
              targetId: removedMutes[0]!.userId,
            });
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listInvitations", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMember",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.spaceInvitations.findMany({
            where: { spaceId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new SpaceInvitationEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMember",
          });
          const role = payload.roleId
            ? yield* database.query.roles.findFirst({
                where: {
                  id: payload.roleId,
                  spaceId: params.id,
                },
              })
            : yield* database.query.roles.findFirst({
                where: {
                  spaceId: params.id,
                  isDefault: true,
                },
              });
          if (!role) {
            return yield* new HttpApiError.InternalServerError();
          }
          const [invitation] = yield* database
            .insert(spaceInvitations)
            .values({
              id: v7(),
              spaceId: params.id,
              email: payload.email,
              roleId: role.id,
              invitedById: user.id,
              token: randomBytes(config.invitation.tokenBytes).toString("hex"),
              expiresAt: payload.expiresAt ?? new Date(Date.now() + config.invitation.expiryMs),
            })
            .returning();
          return new SpaceInvitationEntry(invitation!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "manage",
            subject: "SpaceMember",
          });
          const rows = yield* database
            .delete(spaceInvitations)
            .where(and(eq(spaceInvitations.id, params.invitationId), eq(spaceInvitations.spaceId, params.id)))
            .returning();
          if (rows.length === 0) {
            return yield* new InvitationNotFound();
          }
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listWorks", ({ params, query }) =>
        Effect.gen(function* () {
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.spaceWorks.findMany({
            where: { spaceId: params.id },
            with: { work: true },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.flatMap((row) => {
            if (!row.work) return [];
            return [new SpaceWorkEntry({ ...row, work: new Work(row.work) })];
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("addWork", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "update",
            subject: "Space",
          });
          const work = yield* database.query.works.findFirst({
            where: { id: payload.workId },
          });
          if (!work) {
            return yield* new SpaceWorkNotFound();
          }
          const existing = yield* database.query.spaceWorks.findFirst({
            where: {
              spaceId: params.id,
              workId: payload.workId,
            },
          });
          if (existing) {
            return yield* new SpaceWorkConflict();
          }
          const [row] = yield* database
            .insert(spaceWorks)
            .values({
              id: v7(),
              spaceId: params.id,
              workId: payload.workId,
              addedById: user.id,
            })
            .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "work_add",
            targetType: "work",
            targetId: payload.workId,
          });
          return new SpaceWorkEntry({ ...row!, work: new Work(work) });
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("removeWork", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: params.id },
          });
          if (!space) {
            return yield* new SpaceNotFound();
          }
          yield* authorization.check(user.id, params.id, {
            action: "update",
            subject: "Space",
          });
          const rows = yield* database
            .delete(spaceWorks)
            .where(and(eq(spaceWorks.spaceId, params.id), eq(spaceWorks.workId, params.workId)))
            .returning();
          if (rows.length === 0) {
            return yield* new SpaceWorkNotFound();
          }
          yield* database.insert(modLog).values({
            id: v7(),
            spaceId: params.id,
            moderatorId: user.id,
            action: "work_remove",
            targetType: "work",
            targetId: params.workId,
          });
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new SpaceForbidden()),
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
          const invitation = yield* database.query.spaceInvitations.findFirst({
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
              .update(spaceInvitations)
              .set({ status: "expired" })
              .where(eq(spaceInvitations.id, invitation.id));
            return yield* new InvitationInvalid();
          }
          if (invitation.email !== user.email) {
            return yield* new SpaceForbidden();
          }
          const existingMember = yield* database.query.spaceMembers.findFirst({
            where: {
              spaceId: invitation.spaceId,
              userId: user.id,
            },
          });
          if (existingMember) {
            return yield* new AlreadyMember();
          }
          const ban = yield* database.query.spaceBans.findFirst({
            where: {
              spaceId: invitation.spaceId,
              userId: user.id,
            },
          });
          if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
            return yield* new UserBanned();
          }
          const [member] = yield* database
            .insert(spaceMembers)
            .values({
              id: v7(),
              spaceId: invitation.spaceId,
              userId: user.id,
              roleId: invitation.roleId,
            })
            .returning();
          yield* database
            .update(spaceInvitations)
            .set({ status: "accepted" })
            .where(eq(spaceInvitations.id, invitation.id));
          yield* database
            .update(spaces)
            .set({
              memberCount: sql`${spaces.memberCount} + 1`,
            })
            .where(eq(spaces.id, invitation.spaceId));
          return new SpaceMemberEntry(member!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
