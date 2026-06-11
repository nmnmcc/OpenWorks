import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";

/**
 * 空间，内容组织与权限判定的核心边界（类似 subreddit）。
 * visibility 控制非成员可见性（public/restricted/private）；
 * postingRestriction 控制发帖门槛（member/moderator/admin）；
 * memberCount 为反范式计数，随成员增减同步维护，避免列表页 COUNT。
 */
export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().$defaultFn(v7),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  banner: text("banner"),
  visibility: text("visibility").default("public").notNull(),
  postingRestriction: text("posting_restriction").default("member").notNull(),
  nsfw: boolean("nsfw").default(false).notNull(),
  memberCount: integer("member_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * 空间内的自定义角色（如版主、普通成员）。每个空间维护自己的角色集合，
 * isDefault 标记新成员加入时自动获得的角色。
 * 角色本身不含权限，通过 rolePermissions 关联到具体权限规则。
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    name: text("name").notNull(),
    description: text("description"),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("roles_spaceId_idx").on(table.spaceId)],
);

/**
 * 单条权限规则，结构对应 @nmnmcc/ability 的规则定义：
 * 对某类资源（subject）的某个操作（action）授权或禁止（inverted），
 * 可限定到字段级（fields）并附加条件匹配（conditions）。
 * Authorization 服务把成员角色关联的所有规则装配成 Ability 后做判定。
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().$defaultFn(v7),
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

/**
 * 角色与权限规则的多对多关联，决定持有某角色的成员实际获得哪些规则。
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

/**
 * 空间成员资格，记录用户在空间中持有的角色，
 * 是授权链路的入口：用户 → 成员 → 角色 → 权限规则。
 * 每用户在每空间最多一条记录；roleId 用 restrict 防止删除仍被成员持有的角色。
 */
export const spaceMembers = pgTable(
  "space_members",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("space_members_spaceId_userId_idx").on(table.spaceId, table.userId),
    index("space_members_userId_idx").on(table.userId),
    index("space_members_roleId_idx").on(table.roleId),
  ],
);

/**
 * 空间封禁记录。被封禁用户无法参与该空间；
 * expiresAt 为空表示永久封禁，否则到期自动失效。
 * bannedById 记录执行封禁的版主，便于追责。
 */
export const spaceBans = pgTable(
  "space_bans",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    bannedById: uuid("banned_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("space_bans_spaceId_userId_idx").on(table.spaceId, table.userId),
    index("space_bans_userId_idx").on(table.userId),
  ],
);

/**
 * 空间禁言记录。与封禁的区别在于程度：被禁言用户仍可浏览空间，
 * 但不能发帖/评论。expiresAt 为空表示永久禁言。
 */
export const spaceMutes = pgTable(
  "space_mutes",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    mutedById: uuid("muted_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("space_mutes_spaceId_userId_idx").on(table.spaceId, table.userId),
    index("space_mutes_userId_idx").on(table.userId),
  ],
);

/**
 * 按邮箱发出的入空间邀请（主要面向非公开空间）。
 * token 用于生成接受邀请的链接；roleId 预先指定受邀者加入后获得的角色；
 * status 跟踪邀请的生命周期（初始为 pending），过期后不可再接受。
 */
export const spaceInvitations = pgTable(
  "space_invitations",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    invitedById: uuid("invited_by_id")
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
    index("space_invitations_spaceId_idx").on(table.spaceId),
    index("space_invitations_email_idx").on(table.email),
  ],
);
