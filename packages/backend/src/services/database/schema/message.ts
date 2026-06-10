import { pgTable, text, uuid, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";

/**
 * 用户间一对一私信。deletedBySender/deletedByRecipient 实现双方各自独立的
 * 软删除——一方从自己的信箱删除不影响另一方仍能看到这条私信。
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    deletedBySender: boolean("deleted_by_sender").default(false).notNull(),
    deletedByRecipient: boolean("deleted_by_recipient").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_senderId_idx").on(table.senderId),
    index("messages_recipientId_idx").on(table.recipientId),
  ],
);
