import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import type { PortableTextContent } from "../../../libraries/portable-text";
import { users } from "./auth";
import { posts } from "./post";
import { spaces } from "./space";

/**
 * 帖子下的评论。parentId 自引用构成无限层级的评论树（为空即顶层评论）；
 * spaceId 冗余存储帖子所属空间，使空间级的版务查询与权限判定无需联表回查帖子。
 * removed/removedById/removedReason 实现版务软移除（保留树结构与审计信息）；
 * score 为投票聚合的反范式计数。
 */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    content: jsonb("content").$type<PortableTextContent>().notNull(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    spaceId: uuid("space_id").references(() => spaces.id, {
      onDelete: "cascade",
    }),
    removed: boolean("removed").default(false).notNull(),
    removedById: uuid("removed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    removedReason: text("removed_reason"),
    score: integer("score").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comments_authorId_idx").on(table.authorId),
    index("comments_postId_idx").on(table.postId),
    index("comments_parentId_idx").on(table.parentId),
    index("comments_spaceId_idx").on(table.spaceId),
  ],
);
