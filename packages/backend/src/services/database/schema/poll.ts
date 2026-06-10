import { pgTable, text, uuid, timestamp, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { users } from "./auth";
import { posts } from "./post";

/**
 * 投票贴的投票主体，与 type 为 poll 的帖子一对一（postId 唯一）。
 * votingEndsAt 为截止时间，为空表示投票不截止。
 */
export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().$defaultFn(v7),
  postId: uuid("post_id")
    .notNull()
    .unique()
    .references(() => posts.id, { onDelete: "cascade" }),
  votingEndsAt: timestamp("voting_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 投票的候选项。position 控制展示顺序；
 * voteCount 为反范式计数，随 pollVotes 增删同步维护，避免展示时聚合。
 */
export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    position: integer("position").default(0).notNull(),
    voteCount: integer("vote_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("poll_options_pollId_idx").on(table.pollId)],
);

/**
 * 用户在投票贴中的投票记录。(pollId, userId) 唯一保证每人一票，
 * 同时冗余 pollId 与 optionId，便于按整个投票或单个选项两个维度查询。
 */
export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().$defaultFn(v7),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("poll_votes_pollId_userId_idx").on(table.pollId, table.userId),
    index("poll_votes_optionId_idx").on(table.optionId),
  ],
);
