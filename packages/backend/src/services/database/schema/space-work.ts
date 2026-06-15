import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { users } from "./auth";
import { spaces } from "./space";
import { works } from "./work";

/**
 * 社区与作品的弱关联（双向发现）：版主把作品"挂"到社区，
 * 社区主页侧栏展示"相关作品"，作品详情页展示"相关社区"。
 * 社区不拥有作品——删除任意一端即级联清除关联；(spaceId, workId) 唯一。
 */
export const spaceWorks = pgTable(
  "space_works",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    addedById: uuid("added_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("space_works_spaceId_workId_idx").on(table.spaceId, table.workId),
    index("space_works_workId_idx").on(table.workId),
  ],
);
