import { pgTable, text, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";
import { groups } from "./group";

/**
 * 用户在特定群组内佩戴的个人标识（flair），随用户名一起展示。
 * 与 postFlairs（贴在帖子上的分类标签）不同，这是按群组给用户的身份徽章，
 * 每用户在每群组最多一个。
 */
export const userFlairs = pgTable(
  "user_flairs",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_flairs_groupId_userId_idx").on(table.groupId, table.userId),
    index("user_flairs_userId_idx").on(table.userId),
  ],
);
