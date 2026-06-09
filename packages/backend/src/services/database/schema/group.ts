import {
	pgTable,
	text,
	timestamp,
	boolean,
	jsonb,
	index,
	uniqueIndex,
	primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const groups = pgTable("groups", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const roles = pgTable(
	"roles",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("roles_groupId_idx").on(table.groupId)],
);

export const permissions = pgTable("permissions", {
	id: text("id").primaryKey(),
	action: text("action").notNull(),
	subject: text("subject").notNull(),
	fields: text("fields").array(),
	conditions: jsonb("conditions"),
	inverted: boolean("inverted").default(false).notNull(),
	reason: text("reason"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const rolePermissions = pgTable(
	"role_permissions",
	{
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permissionId: text("permission_id")
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.roleId, table.permissionId] }),
	],
);

export const groupMembers = pgTable(
	"group_members",
	{
		id: text("id").primaryKey(),
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "restrict" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("group_members_groupId_userId_idx").on(
			table.groupId,
			table.userId,
		),
		index("group_members_userId_idx").on(table.userId),
		index("group_members_roleId_idx").on(table.roleId),
	],
);

export const groupInvitations = pgTable(
	"group_invitations",
	{
		id: text("id").primaryKey(),
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		invitedById: text("invited_by_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text("status").default("pending").notNull(),
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("group_invitations_groupId_idx").on(table.groupId),
		index("group_invitations_email_idx").on(table.email),
	],
);
