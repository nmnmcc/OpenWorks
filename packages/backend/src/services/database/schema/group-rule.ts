import { pgTable, text, uuid, timestamp, integer, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { groups } from "./group";

/**
 * 群组的社区规则条目，展示在群组页面供成员遵循，举报时可引用为理由。
 * position 控制条目的展示顺序。
 */
export const groupRules = pgTable(
  "group_rules",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("group_rules_groupId_idx").on(table.groupId)],
);
