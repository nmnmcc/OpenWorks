import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { works } from "./work";

/**
 * 作品外部引用，关联到 ISBN/TMDB/Steam 等外部数据源。
 * (source, externalId) 全局唯一——同一外部 ID 只关联一个作品，
 * 导入时据此检测已存在条目并提示跳转。
 */
export const workExternalRefs = pgTable(
  "work_external_refs",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    url: text("url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("work_external_refs_source_externalId_idx").on(table.source, table.externalId)],
);
