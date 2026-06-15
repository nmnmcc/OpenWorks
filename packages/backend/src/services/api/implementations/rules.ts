import { eq } from "drizzle-orm";
import { Effect, Option } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Database } from "../../database";
import { spaceRules } from "../../database/schema/space-rule";
import { Api } from "../interfaces";
import { CurrentUser, CurrentUserOption } from "../interfaces/middlewares/auth";
import { RuleForbidden, RuleNotFound, SpaceRuleEntry } from "../interfaces/rules";

export const RulesHandlers = HttpApiBuilder.group(
  Api,
  "rules",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const userId = Option.getOrUndefined(yield* CurrentUserOption)?.id;
          const space = yield* database.query.spaces.findFirst({
            where: { id: query.spaceId },
          });
          if (space && space.visibility === "private") {
            const membership =
              userId === undefined
                ? undefined
                : yield* database.query.spaceMembers.findFirst({
                    where: {
                      spaceId: query.spaceId,
                      userId,
                    },
                  });
            if (!membership) {
              return yield* new RuleForbidden();
            }
          }
          const rows = yield* database.query.spaceRules.findMany({
            where: { spaceId: query.spaceId },
            orderBy: { position: "asc" },
          });
          return rows.map((row) => new SpaceRuleEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, payload.spaceId, {
            action: "manage",
            subject: "SpaceRule",
          });
          const [row] = yield* database
            .insert(spaceRules)
            .values({
              id: v7(),
              spaceId: payload.spaceId,
              title: payload.title,
              description: payload.description,
              position: payload.position ?? 0,
            })
            .returning();
          return new SpaceRuleEntry(row!);
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
          const existing = yield* database.query.spaceRules.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new RuleNotFound();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "SpaceRule",
          });
          const [row] = yield* database
            .update(spaceRules)
            .set({
              title: payload.title,
              description: payload.description,
              position: payload.position,
            })
            .where(eq(spaceRules.id, params.id))
            .returning();
          return new SpaceRuleEntry(row!);
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
          const existing = yield* database.query.spaceRules.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new RuleNotFound();
          }
          yield* authorization.check(user.id, existing.spaceId, {
            action: "manage",
            subject: "SpaceRule",
          });
          yield* database.delete(spaceRules).where(eq(spaceRules.id, params.id));
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
