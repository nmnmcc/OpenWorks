import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { comments } from "./comment";
import { posts } from "./post";

/**
 * 用户对帖子或评论的赞/踩。postId 与 commentId 二选一指向投票目标；
 * value 为投票方向（赞 +1、踩 -1）；唯一索引保证每用户对同一目标只有一票，
 * 改票时更新 value。聚合结果反范式存于 posts.score / comments.score。
 */
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("votes_userId_postId_idx").on(table.userId, table.postId),
    uniqueIndex("votes_userId_commentId_idx").on(table.userId, table.commentId),
    index("votes_postId_idx").on(table.postId),
    index("votes_commentId_idx").on(table.commentId),
  ],
);
