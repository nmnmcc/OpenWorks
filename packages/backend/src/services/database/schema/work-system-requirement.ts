import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { works } from "./work";

/**
 * 作品系统配置需求表，仅 game 类型使用。
 * platform × tier（minimum/recommended）构成唯一组合，
 * 各硬件字段均为可空文本。
 */
export const workSystemRequirements = pgTable(
  "work_system_requirements",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    tier: text("tier").notNull(),
    os: text("os"),
    cpu: text("cpu"),
    memory: text("memory"),
    graphics: text("graphics"),
    storage: text("storage"),
    notes: text("notes"),
  },
  (table) => [uniqueIndex("work_system_requirements_workId_platform_tier_idx").on(table.workId, table.platform, table.tier)],
);
