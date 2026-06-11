import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import type { PortableTextContent } from "../../../libraries/portable-text";
import { users } from "./auth";

/**
 * 作品主表，type 区分四种内容类型（book/movie/tv/game）。
 * 类型特定字段为可空列——book 用 isbn/pageCount，movie/tv 用 runtimeMinutes/seasonCount/episodeCount，
 * game 用 platforms/website。targetWorkId 非空表示该条目为变体（指向主条目），
 * 浏览页只展示主条目，变体通过详情页"版本"标签进入。
 * ratingCount/ratingSum/recommendedCount/reviewCount/libraryCount 为反范式计数，
 * 分别随评分、评测与收藏操作同步维护。
 */
export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    type: text("type").notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title"),
    description: jsonb("description").$type<PortableTextContent>(),
    coverUrl: text("cover_url"),
    releaseDate: timestamp("release_date"),
    isbn: text("isbn"),
    pageCount: integer("page_count"),
    runtimeMinutes: integer("runtime_minutes"),
    seasonCount: integer("season_count"),
    episodeCount: integer("episode_count"),
    platforms: text("platforms").array(),
    website: text("website"),
    nsfw: boolean("nsfw").default(false).notNull(),
    targetWorkId: uuid("target_work_id").references((): any => works.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ratingCount: integer("rating_count").default(0).notNull(),
    ratingSum: integer("rating_sum").default(0).notNull(),
    recommendedCount: integer("recommended_count").default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    libraryCount: integer("library_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("works_type_idx").on(table.type),
    index("works_createdById_idx").on(table.createdById),
    index("works_targetWorkId_idx").on(table.targetWorkId),
  ],
);

/**
 * 作品修订历史。每次编辑追加一条完整可编辑字段快照（而非 diff），
 * 支持查看历史版本；reason 为编辑者填写的修改说明。
 */
export const workRevisions = pgTable(
  "work_revisions",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    editedById: uuid("edited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    snapshot: jsonb("snapshot").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("work_revisions_workId_idx").on(table.workId)],
);
