import { index, integer, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { works } from "./work";

/**
 * 用户对作品的评分，值 1–10（IMDB 制，前端以 5 星半步展示）。
 * 每人每作品一条，upsert 时通过差值维护 works 表的
 * ratingCount/ratingSum/recommendedCount 反范式计数。
 */
export const workRatings = pgTable(
  "work_ratings",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("work_ratings_userId_workId_idx").on(table.userId, table.workId),
    index("work_ratings_workId_idx").on(table.workId),
  ],
);
