import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { works } from "./work";

/**
 * 全局作品标签词表，name 小写规范化后全局唯一。
 * 标签由用户通过 workTagApplications 施加到作品上，
 * 展示权重 = 施加该标签的用户数。
 */
export const workTags = pgTable(
  "work_tags",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

/**
 * 用户对作品施加标签的记录，(workId, tagId, userId) 唯一——
 * 每人对每作品的每个标签只能施加一次。
 */
export const workTagApplications = pgTable(
  "work_tag_applications",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => workTags.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("work_tag_applications_workId_tagId_userId_idx").on(table.workId, table.tagId, table.userId),
    index("work_tag_applications_workId_idx").on(table.workId),
    index("work_tag_applications_tagId_idx").on(table.tagId),
  ],
);
