import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { posts } from "./post";

/**
 * 用户主动隐藏的帖子。仅影响该用户自己的浏览体验——
 * 信息流与列表查询会过滤掉这些帖子，对其他用户无任何影响。
 */
export const hiddenPosts = pgTable(
  "hidden_posts",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("hidden_posts_userId_postId_idx").on(table.userId, table.postId)],
);
