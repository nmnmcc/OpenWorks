import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import type { PortableTextContent } from "../../../libraries/portable-text";
import { users } from "./auth";
import { spaces } from "./space";
import { works } from "./work";

/**
 * 空间内可用的帖子标签（flair），由版主定义、发帖时选用，
 * 用于在空间内对帖子做可视化分类与筛选。
 */
export const postFlairs = pgTable(
  "post_flairs",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("post_flairs_spaceId_idx").on(table.spaceId)],
);

/**
 * 帖子主表。type 区分四种形态（text/link/image/poll）：
 * 文本帖的正文存 content（Portable Text 块数组），链接帖存 url，
 * 投票帖额外关联 polls 表。spaceId 为空表示帖子不属于任何空间。
 * removed/removedById/removedReason 实现版务软移除——内容对外隐藏但保留供审计；
 * commentCount/score 为反范式计数，分别随评论与投票变更同步维护。
 * 本表的增删改由 Sequin 从 WAL 捕获、经 Kafka 异步同步到全文搜索索引。
 */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    title: text("title").notNull(),
    type: text("type").default("text").notNull(),
    content: jsonb("content").$type<PortableTextContent>(),
    url: text("url"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id").references(() => spaces.id, {
      onDelete: "cascade",
    }),
    flairId: uuid("flair_id").references(() => postFlairs.id, {
      onDelete: "set null",
    }),
    workId: uuid("work_id").references(() => works.id, {
      onDelete: "set null",
    }),
    pinned: boolean("pinned").default(false).notNull(),
    locked: boolean("locked").default(false).notNull(),
    nsfw: boolean("nsfw").default(false).notNull(),
    spoiler: boolean("spoiler").default(false).notNull(),
    removed: boolean("removed").default(false).notNull(),
    removedById: uuid("removed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    removedReason: text("removed_reason"),
    commentCount: integer("comment_count").default(0).notNull(),
    score: integer("score").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("posts_authorId_idx").on(table.authorId),
    index("posts_spaceId_idx").on(table.spaceId),
    index("posts_flairId_idx").on(table.flairId),
    index("posts_workId_idx").on(table.workId),
  ],
);
