import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { works } from "./work";

/**
 * 用户自定义书架，独立于五档库状态。isPublic 控制是否对外可见，
 * itemCount 为反范式计数，随条目增删同步维护。
 */
export const shelves = pgTable(
  "shelves",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(true).notNull(),
    itemCount: integer("item_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("shelves_ownerId_idx").on(table.ownerId)],
);

/**
 * 书架条目，关联书架与作品。note 为用户附加的个人批注。
 * (shelfId, workId) 唯一——同一作品不重复加入同一书架。
 */
export const shelfItems = pgTable(
  "shelf_items",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    shelfId: uuid("shelf_id")
      .notNull()
      .references(() => shelves.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("shelf_items_shelfId_workId_idx").on(table.shelfId, table.workId),
    index("shelf_items_shelfId_idx").on(table.shelfId),
    index("shelf_items_workId_idx").on(table.workId),
  ],
);
