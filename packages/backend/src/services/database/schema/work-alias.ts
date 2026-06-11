import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { works } from "./work";

/**
 * 作品别名，支持跨语言/跨文化内容发现。
 * kind 区分别名类型（common/abbreviation/transliteration/alternate_title/
 * legacy_title/misspelling/other），别名进搜索索引以提升可发现性。
 * (workId, value) 唯一——同一作品不重复同名别名。
 */
export const workAliases = pgTable(
  "work_aliases",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    kind: text("kind").notNull(),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("work_aliases_workId_value_idx").on(table.workId, table.value)],
);
