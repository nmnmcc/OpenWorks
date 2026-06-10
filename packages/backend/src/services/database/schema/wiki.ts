import { pgTable, text, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";
import { groups } from "./group";

/**
 * 群组 wiki 页面，content 始终保存当前最新内容（历史版本见 wikiRevisions）。
 * slug 在群组内唯一，构成页面 URL。
 */
export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    lastEditedById: uuid("last_edited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("wiki_pages_groupId_slug_idx").on(table.groupId, table.slug),
    index("wiki_pages_groupId_idx").on(table.groupId),
  ],
);

/**
 * wiki 页面的修订历史。每次编辑追加一条完整内容快照（而非 diff），
 * 支持查看历史版本与回滚；reason 为编辑者填写的修改说明。
 */
export const wikiRevisions = pgTable(
  "wiki_revisions",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    pageId: uuid("page_id")
      .notNull()
      .references(() => wikiPages.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    editedById: uuid("edited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("wiki_revisions_pageId_idx").on(table.pageId)],
);
