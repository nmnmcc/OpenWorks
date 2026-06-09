import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	users: {
		sessions: r.many.sessions(),
		accounts: r.many.accounts(),
		groupMembers: r.many.groupMembers(),
		groupInvitations: r.many.groupInvitations(),
	},
	sessions: {
		user: r.one.users({
			from: r.sessions.userId,
			to: r.users.id,
		}),
	},
	accounts: {
		user: r.one.users({
			from: r.accounts.userId,
			to: r.users.id,
		}),
	},
	groups: {
		roles: r.many.roles(),
		members: r.many.groupMembers(),
		invitations: r.many.groupInvitations(),
	},
	roles: {
		group: r.one.groups({
			from: r.roles.groupId,
			to: r.groups.id,
		}),
		rolePermissions: r.many.rolePermissions(),
		members: r.many.groupMembers(),
	},
	permissions: {
		rolePermissions: r.many.rolePermissions(),
	},
	rolePermissions: {
		role: r.one.roles({
			from: r.rolePermissions.roleId,
			to: r.roles.id,
		}),
		permission: r.one.permissions({
			from: r.rolePermissions.permissionId,
			to: r.permissions.id,
		}),
	},
	groupMembers: {
		group: r.one.groups({
			from: r.groupMembers.groupId,
			to: r.groups.id,
		}),
		user: r.one.users({
			from: r.groupMembers.userId,
			to: r.users.id,
		}),
		role: r.one.roles({
			from: r.groupMembers.roleId,
			to: r.roles.id,
		}),
	},
	groupInvitations: {
		group: r.one.groups({
			from: r.groupInvitations.groupId,
			to: r.groups.id,
		}),
		role: r.one.roles({
			from: r.groupInvitations.roleId,
			to: r.roles.id,
		}),
		invitedBy: r.one.users({
			from: r.groupInvitations.invitedById,
			to: r.users.id,
		}),
	},
}));
