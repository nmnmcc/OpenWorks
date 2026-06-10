import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq, and } from "drizzle-orm";
import { Api, PostFlairEntry, UserFlairEntry, FlairNotFound, FlairForbidden, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { postFlairs, userFlairs } from "../../database/schema";

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
          const group = yield* database.query.groups.findFirst({
            where: { id: query.groupId },
          });
          if (group && group.visibility === "private") {
            const membership = yield* database.query.groupMembers.findFirst({
              where: {
                groupId: query.groupId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          }
          const rows = yield* database.query.postFlairs.findMany({
            where: { groupId: query.groupId },
            orderBy: { createdAt: "asc" },
          });
          return rows.map((row) => new PostFlairEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("createPostFlair", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, payload.groupId, {
            action: "manage",
            subject: "PostFlair",
          });
          const [row] = yield* database
            .insert(postFlairs)
            .values({
              id: v7(),
              groupId: payload.groupId,
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
          yield* authorization.check(user.id, existing.groupId, {
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
          yield* authorization.check(user.id, existing.groupId, {
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
          const group = yield* database.query.groups.findFirst({
            where: { id: query.groupId },
          });
          if (group && group.visibility === "private") {
            const membership = yield* database.query.groupMembers.findFirst({
              where: {
                groupId: query.groupId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          }
          const row = yield* database.query.userFlairs.findFirst({
            where: {
              groupId: query.groupId,
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
            const membership = yield* database.query.groupMembers.findFirst({
              where: {
                groupId: payload.groupId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new FlairForbidden();
            }
          } else {
            yield* authorization.check(user.id, payload.groupId, {
              action: "manage",
              subject: "UserFlair",
            });
          }
          const existing = yield* database.query.userFlairs.findFirst({
            where: {
              groupId: payload.groupId,
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
              groupId: payload.groupId,
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
            yield* authorization.check(user.id, query.groupId, {
              action: "manage",
              subject: "UserFlair",
            });
          }
          yield* database
            .delete(userFlairs)
            .where(and(eq(userFlairs.groupId, query.groupId), eq(userFlairs.userId, query.userId)));
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
