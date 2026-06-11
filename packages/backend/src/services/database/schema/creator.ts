import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import type { PortableTextContent } from "../../../libraries/portable-text";
import { users } from "./auth";
import { works } from "./work";

/**
 * 创作者实体，kind 区分个人（person）与组织（organization，含出版社/工作室/团体等）。
 * bio 为 Portable Text 富文本简介。任何登录用户可创建与编辑，
 * 修订历史存 creatorRevisions。
 */
export const creators = pgTable(
  "creators",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    bio: jsonb("bio").$type<PortableTextContent>(),
    imageUrl: text("image_url"),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("creators_createdById_idx").on(table.createdById)],
);

/**
 * 创作者修订历史，结构与 workRevisions 一致。
 */
export const creatorRevisions = pgTable(
  "creator_revisions",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id, { onDelete: "cascade" }),
    editedById: uuid("edited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    snapshot: jsonb("snapshot").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("creator_revisions_creatorId_idx").on(table.creatorId)],
);

/**
 * 作品署名，关联作品与创作者。role 为具体角色（author/director/developer 等），
 * characterName 用于演员角色（如"饰演 xxx"），position 控制展示顺序。
 * (workId, creatorId, role) 唯一——同一创作者可以多角色参与同一作品。
 */
export const workCredits = pgTable(
  "work_credits",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    characterName: text("character_name"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("work_credits_workId_creatorId_role_idx").on(table.workId, table.creatorId, table.role),
    index("work_credits_workId_idx").on(table.workId),
    index("work_credits_creatorId_idx").on(table.creatorId),
  ],
);
