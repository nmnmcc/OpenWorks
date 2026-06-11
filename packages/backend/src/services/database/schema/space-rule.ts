import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { spaces } from "./space";

/**
 * 空间的社区规则条目，展示在空间页面供成员遵循，举报时可引用为理由。
 * position 控制条目的展示顺序。
 */
export const spaceRules = pgTable(
  "space_rules",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("space_rules_spaceId_idx").on(table.spaceId)],
);
