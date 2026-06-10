import { pgTable, serial, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * 帖子全文索引同步的 outbox 队列（CDC 服务的数据源）。
 * 行由 posts 表上的数据库触发器写入（应用代码不直接插入）：
 * 每次增删改记录 TG_OP（INSERT/UPDATE/DELETE）与帖子 id 并 pg_notify 唤醒消费者，
 * CDC 服务按 id 顺序批量排空、同步到搜索引擎后删除已处理行。
 * id 用 serial 保证消费顺序；postId 不设外键——DELETE 记录指向的帖子已不存在。
 */
export const searchOutbox = pgTable("search_outbox", {
  id: serial("id").primaryKey(),
  operation: text("operation").notNull(),
  postId: uuid("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
