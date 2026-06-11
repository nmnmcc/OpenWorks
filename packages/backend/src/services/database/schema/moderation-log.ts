import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { spaces } from "./space";

/**
 * 空间版务操作的审计日志，追加式写入、不可修改（故无 updatedAt）。
 * targetType + targetId 多态指向操作对象（帖子、评论、用户等，不设外键以便
 * 对象删除后日志仍可保留），details 存放各操作类型自定义的附加上下文。
 */
export const modLog = pgTable(
  "mod_log",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    moderatorId: uuid("moderator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("mod_log_spaceId_idx").on(table.spaceId),
    index("mod_log_moderatorId_idx").on(table.moderatorId),
    index("mod_log_createdAt_idx").on(table.createdAt),
  ],
);
