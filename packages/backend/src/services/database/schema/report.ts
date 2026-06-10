import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";
import { groups } from "./group";
import { posts } from "./post";
import { comments } from "./comment";

/**
 * 用户对违规内容的举报，进入所属群组的版务处理队列。
 * postId 与 commentId 二选一指向被举报内容；
 * status 从 pending 流转到 resolved（已处理）或 dismissed（驳回），
 * 处理结果由 resolvedById 与 resolutionNote 记录。
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    reason: text("reason").notNull(),
    status: text("status").default("pending").notNull(),
    resolvedById: uuid("resolved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("reports_groupId_idx").on(table.groupId),
    index("reports_reporterId_idx").on(table.reporterId),
    index("reports_postId_idx").on(table.postId),
    index("reports_commentId_idx").on(table.commentId),
    index("reports_status_idx").on(table.status),
  ],
);
