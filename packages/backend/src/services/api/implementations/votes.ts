import { eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Database } from "../../database";
import { comments } from "../../database/schema/comment";
import { posts } from "../../database/schema/post";
import { votes } from "../../database/schema/vote";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { Vote, VoteForbidden, VoteTargetNotFound } from "../interfaces/votes";

export const VotesHandlers = HttpApiBuilder.group(
  Api,
  "votes",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    const applyScoreDelta = Effect.fn(function* (
      target: { postId?: string | null; commentId?: string | null },
      delta: number,
    ) {
      if (delta === 0) {
        return;
      }
      if (target.postId) {
        yield* database
          .update(posts)
          .set({ score: sql`${posts.score} + ${delta}` })
          .where(eq(posts.id, target.postId));
      } else if (target.commentId) {
        yield* database
          .update(comments)
          .set({ score: sql`${comments.score} + ${delta}` })
          .where(eq(comments.id, target.commentId));
      }
    });

    return handlers
      .handle("cast", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          const target = payload.postId
            ? yield* database.query.posts.findFirst({
                where: { id: payload.postId },
              })
            : payload.commentId
              ? yield* database.query.comments.findFirst({
                  where: { id: payload.commentId },
                })
              : undefined;

          if (!target) {
            return yield* new VoteTargetNotFound();
          }

          const spaceId = target.spaceId;

          if (spaceId) {
            yield* authorization.check(user.id, spaceId, {
              action: "create",
              subject: "Vote",
            });
          }

          const existing = yield* database.query.votes.findFirst({
            where: payload.postId
              ? { userId: user.id, postId: payload.postId }
              : {
                  userId: user.id,
                  commentId: payload.commentId,
                },
          });

          if (existing) {
            const [updated] = yield* database
              .update(votes)
              .set({ value: payload.value })
              .where(eq(votes.id, existing.id))
              .returning();
            yield* applyScoreDelta(payload, payload.value - existing.value);
            return new Vote(updated!);
          }

          const [row] = yield* database
            .insert(votes)
            .values({
              id: v7(),
              userId: user.id,
              postId: payload.postId,
              commentId: payload.commentId,
              value: payload.value,
            })
            .returning();

          yield* applyScoreDelta(payload, payload.value);

          return new Vote(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new VoteForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.votes.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return;
          }
          if (existing.userId !== user.id) {
            return yield* new VoteForbidden();
          }
          yield* database.delete(votes).where(eq(votes.id, params.id));
          yield* applyScoreDelta(existing, -existing.value);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
