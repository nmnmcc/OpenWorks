import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { works } from "./work";
import { workChapters } from "./work-chapter";

/**
 * 用户个人库条目，status 为五档阅读/游玩状态
 * （want/active/completed/on_hold/dropped）。
 * 每人每作品一条，库默认公开（任何人可查他人库页）。
 * lastReadChapterId 支持"继续阅读"跳转。
 */
export const libraryItems = pgTable(
  "library_items",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    lastReadChapterId: uuid("last_read_chapter_id").references(() => workChapters.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("library_items_userId_workId_idx").on(table.userId, table.workId),
    index("library_items_userId_idx").on(table.userId),
    index("library_items_workId_idx").on(table.workId),
  ],
);
