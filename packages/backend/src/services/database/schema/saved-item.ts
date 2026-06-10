import { pgTable, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";
import { posts } from "./post";
import { comments } from "./comment";

/**
 * 用户的收藏列表。postId 与 commentId 二选一指向被收藏的帖子或评论，
 * 唯一索引防止重复收藏同一内容。
 */
export const savedItems = pgTable(
  "saved_items",
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("saved_items_userId_postId_idx").on(table.userId, table.postId),
    uniqueIndex("saved_items_userId_commentId_idx").on(table.userId, table.commentId),
    index("saved_items_userId_idx").on(table.userId),
  ],
);
