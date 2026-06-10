import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, sql } from "drizzle-orm";
import { Api, PollEntry, PollOptionEntry, PollNotFound, PollClosed, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { pollOptions, pollVotes } from "../../database/schema";

export const PollsHandlers = HttpApiBuilder.group(
  Api,
  "polls",
  Effect.fn(function* (handlers) {
    const database = yield* Database;

    return handlers
      .handle("getByPostId", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const poll = yield* database.query.polls.findFirst({
            where: { postId: params.postId },
            with: { options: true },
          });
          if (!poll) {
            return yield* new PollNotFound();
          }
          const post = yield* database.query.posts.findFirst({
            where: { id: poll.postId },
          });
          if (!post || post.removed) {
            return yield* new PollNotFound();
          }
          if (post.groupId) {
            const group = yield* database.query.groups.findFirst({
              where: { id: post.groupId },
            });
            if (group && group.visibility === "private") {
              const membership = yield* database.query.groupMembers.findFirst({
                where: {
                  groupId: group.id,
                  userId: user.id,
                },
              });
              if (!membership) {
                return yield* new PollNotFound();
              }
            }
          }
          const userVote = yield* database.query.pollVotes.findFirst({
            where: {
              pollId: poll.id,
              userId: user.id,
            },
          });
          return new PollEntry({
            id: poll.id,
            postId: poll.postId,
            votingEndsAt: poll.votingEndsAt,
            options: poll.options.map((opt) => new PollOptionEntry(opt)),
            userVotedOptionId: userVote?.optionId ?? null,
            createdAt: poll.createdAt,
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("vote", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const poll = yield* database.query.polls.findFirst({
            where: { postId: params.postId },
            with: { options: true },
          });
          if (!poll) {
            return yield* new PollNotFound();
          }
          const post = yield* database.query.posts.findFirst({
            where: { id: poll.postId },
          });
          if (!post || post.removed) {
            return yield* new PollNotFound();
          }
          if (post.groupId) {
            const group = yield* database.query.groups.findFirst({
              where: { id: post.groupId },
            });
            if (group && group.visibility === "private") {
              const membership = yield* database.query.groupMembers.findFirst({
                where: {
                  groupId: group.id,
                  userId: user.id,
                },
              });
              if (!membership) {
                return yield* new PollNotFound();
              }
            }
          }
          if (poll.votingEndsAt && poll.votingEndsAt < new Date()) {
            return yield* new PollClosed();
          }
          if (!poll.options.some((option) => option.id === payload.optionId)) {
            return yield* new PollNotFound();
          }
          const existingVote = yield* database.query.pollVotes.findFirst({
            where: {
              pollId: poll.id,
              userId: user.id,
            },
          });
          if (existingVote) {
            if (existingVote.optionId !== payload.optionId) {
              yield* database
                .update(pollOptions)
                .set({
                  voteCount: sql`${pollOptions.voteCount} - 1`,
                })
                .where(eq(pollOptions.id, existingVote.optionId));
              yield* database
                .update(pollVotes)
                .set({ optionId: payload.optionId })
                .where(eq(pollVotes.id, existingVote.id));
              yield* database
                .update(pollOptions)
                .set({
                  voteCount: sql`${pollOptions.voteCount} + 1`,
                })
                .where(eq(pollOptions.id, payload.optionId));
            }
          } else {
            yield* database.insert(pollVotes).values({
              id: v7(),
              pollId: poll.id,
              optionId: payload.optionId,
              userId: user.id,
            });
            yield* database
              .update(pollOptions)
              .set({
                voteCount: sql`${pollOptions.voteCount} + 1`,
              })
              .where(eq(pollOptions.id, payload.optionId));
          }

          const updatedPoll = yield* database.query.polls.findFirst({
            where: { id: poll.id },
            with: { options: true },
          });

          return new PollEntry({
            id: updatedPoll!.id,
            postId: updatedPoll!.postId,
            votingEndsAt: updatedPoll!.votingEndsAt,
            options: updatedPoll!.options.map((opt) => new PollOptionEntry(opt)),
            userVotedOptionId: payload.optionId,
            createdAt: updatedPoll!.createdAt,
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
