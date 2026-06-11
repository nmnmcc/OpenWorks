import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { spaces } from "./space";

/**
 * 用户在特定空间内佩戴的个人标识（flair），随用户名一起展示。
 * 与 postFlairs（贴在帖子上的分类标签）不同，这是按空间给用户的身份徽章，
 * 每用户在每空间最多一个。
 */
export const userFlairs = pgTable(
  "user_flairs",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
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
    uniqueIndex("user_flairs_spaceId_userId_idx").on(table.spaceId, table.userId),
    index("user_flairs_userId_idx").on(table.userId),
  ],
);
