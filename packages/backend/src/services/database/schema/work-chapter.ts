import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import type { PortableTextContent } from "../../../libraries/portable-text";
import { users } from "./auth";
import { works } from "./work";

/**
 * 作品章节/分集，按 position 排序的扁平有序列表。
 * content 为 Portable Text 可空——图书章节有正文，TV 分集可只有标题。
 * 阅读器页展示单章内容，用户可逐章标记已读。
 */
export const workChapters = pgTable(
  "work_chapters",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").default(0).notNull(),
    content: jsonb("content").$type<PortableTextContent>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("work_chapters_workId_idx").on(table.workId)],
);

/**
 * 用户逐章阅读进度，(userId, chapterId) 唯一。
 * 存在即表示该章已读，completedAt 记录完成时间。
 */
export const chapterProgress = pgTable(
  "chapter_progress",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => workChapters.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("chapter_progress_userId_chapterId_idx").on(table.userId, table.chapterId),
    index("chapter_progress_userId_idx").on(table.userId),
  ],
);
