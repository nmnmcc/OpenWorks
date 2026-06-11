import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";

/**
 * 站内通知收件箱（回复、提及、版务动作等事件触达用户的统一渠道）。
 * type 区分通知类别供前端选择展示样式，linkUrl 指向触发通知的内容；
 * (userId, isRead) 复合索引服务未读数与未读列表查询。
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    linkUrl: text("link_url"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_userId_idx").on(table.userId),
    index("notifications_userId_isRead_idx").on(table.userId, table.isRead),
  ],
);
