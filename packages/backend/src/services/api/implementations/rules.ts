import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import { Api, GroupRuleEntry, RuleNotFound, RuleForbidden, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { groupRules } from "../../database/schema";

export const RulesHandlers = HttpApiBuilder.group(
  Api,
  "rules",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", ({ query }) =>
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
              return yield* new RuleForbidden();
            }
          }
          const rows = yield* database.query.groupRules.findMany({
            where: { groupId: query.groupId },
            orderBy: { position: "asc" },
          });
          return rows.map((row) => new GroupRuleEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, payload.groupId, {
            action: "manage",
            subject: "GroupRule",
          });
          const [row] = yield* database
            .insert(groupRules)
            .values({
              id: v7(),
              groupId: payload.groupId,
              title: payload.title,
              description: payload.description,
              position: payload.position ?? 0,
            })
            .returning();
          return new GroupRuleEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new RuleForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.groupRules.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new RuleNotFound();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "GroupRule",
          });
          const [row] = yield* database
            .update(groupRules)
            .set({
              title: payload.title,
              description: payload.description,
              position: payload.position,
            })
            .where(eq(groupRules.id, params.id))
            .returning();
          return new GroupRuleEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new RuleForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.groupRules.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new RuleNotFound();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "GroupRule",
          });
          yield* database.delete(groupRules).where(eq(groupRules.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new RuleForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
