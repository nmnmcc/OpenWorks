import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Database } from "../../database";
import { postFlairs } from "../../database/schema/post";
import { userFlairs } from "../../database/schema/user-flair";
import { Api } from "../interfaces";
import { FlairForbidden, FlairNotFound, PostFlairEntry, UserFlairEntry } from "../interfaces/flairs";
import { CurrentUser } from "../interfaces/middlewares/auth";

export const FlairsHandlers = HttpApiBuilder.group(
  Api,
  "flairs",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("listPostFlairs", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: query.spaceId },
          });
          if (space && space.visibility === "private") {
            const membership = yield* database.query.spaceMembers.findFirst({
              where: {
                spaceId: query.spaceId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          }
          const rows = yield* database.query.postFlairs.findMany({
            where: { spaceId: query.spaceId },
            orderBy: { createdAt: "asc" },
          });
          return rows.map((row) => new PostFlairEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("createPostFlair", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, payload.spaceId, {
            action: "manage",
            subject: "PostFlair",
          });
          const [row] = yield* database
            .insert(postFlairs)
            .values({
              id: v7(),
              spaceId: payload.spaceId,
              name: payload.name,
              color: payload.color,
            })
            .returning();
          return new PostFlairEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new FlairForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("updatePostFlair", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.postFlairs.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new FlairNotFound();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "PostFlair",
          });
          const [row] = yield* database
            .update(postFlairs)
            .set({
              name: payload.name,
              color: payload.color,
            })
            .where(eq(postFlairs.id, params.id))
            .returning();
          return new PostFlairEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new FlairForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("deletePostFlair", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.postFlairs.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new FlairNotFound();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "PostFlair",
          });
          yield* database.delete(postFlairs).where(eq(postFlairs.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new FlairForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("getUserFlair", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const space = yield* database.query.spaces.findFirst({
            where: { id: query.spaceId },
          });
          if (space && space.visibility === "private") {
            const membership = yield* database.query.spaceMembers.findFirst({
              where: {
                spaceId: query.spaceId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          }
          const row = yield* database.query.userFlairs.findFirst({
            where: {
              spaceId: query.spaceId,
              userId: query.userId,
            },
          });
          return row ? new UserFlairEntry(row) : null;
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("setUserFlair", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const isSelf = payload.userId === user.id;
          if (isSelf) {
            const membership = yield* database.query.spaceMembers.findFirst({
              where: {
                spaceId: payload.spaceId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          } else {
            yield* authorization.check(user.id, payload.spaceId, {
              action: "manage",
              subject: "UserFlair",
            });
          }
          const existing = yield* database.query.userFlairs.findFirst({
            where: {
              spaceId: payload.spaceId,
              userId: payload.userId,
            },
          });
          if (existing) {
            const [row] = yield* database
              .update(userFlairs)
              .set({
                text: payload.text,
                color: payload.color,
              })
              .where(eq(userFlairs.id, existing.id))
              .returning();
            return new UserFlairEntry(row!);
          }
          const [row] = yield* database
            .insert(userFlairs)
            .values({
              id: v7(),
              spaceId: payload.spaceId,
              userId: payload.userId,
              text: payload.text,
              color: payload.color,
            })
            .returning();
          return new UserFlairEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new FlairForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("removeUserFlair", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const isSelf = query.userId === user.id;
          if (!isSelf) {
            yield* authorization.check(user.id, query.spaceId, {
              action: "manage",
              subject: "UserFlair",
            });
          }
          yield* database
            .delete(userFlairs)
            .where(and(eq(userFlairs.spaceId, query.spaceId), eq(userFlairs.userId, query.userId)));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new FlairForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
