import { Ability } from "@nmnmcc/ability";
import { and, eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Context, Effect, Layer } from "effect";

import { Database } from "../database";
import { permissions, rolePermissions, spaceMembers } from "../database/schema/space";
import type { Subjects } from "./subjects";

export type { Subjects } from "./subjects";

type AuthorizationAbility = Ability.Ability<Subjects, Ability.AnyRule>;

type BuildAbilityError = EffectDrizzleQueryError | Ability.AliasError | Ability.RawRuleError;

type CheckError =
  | BuildAbilityError
  | Ability.AuthorizationError
  | Ability.ConditionError
  | Ability.SubjectDetectionError;

type PermittedFieldsError = BuildAbilityError | Ability.ConditionError | Ability.SubjectDetectionError;

export class Authorization extends Context.Service<Authorization>()(
  "@openworks/backend/services/authorization/Authorization",
  {
    make: Effect.gen(function* () {
      const database = yield* Database;

      const buildAbility = (userId: string, spaceId: string): Effect.Effect<AuthorizationAbility, BuildAbilityError> =>
        Effect.gen(function* () {
          const rows = yield* database
            .select({
              action: permissions.action,
              subject: permissions.subject,
              fields: permissions.fields,
              conditions: permissions.conditions,
              inverted: permissions.inverted,
              reason: permissions.reason,
            })
            .from(spaceMembers)
            .innerJoin(rolePermissions, eq(spaceMembers.roleId, rolePermissions.roleId))
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.spaceId, spaceId)));

          const rawRules: ReadonlyArray<
            Ability.RawRule<string, Ability.RuleSubject<Subjects>, string, Ability.MongoCondition<object>>
          > = rows.map((row) => ({
            action: row.action,
            subject: row.subject as Ability.RuleSubject<Subjects>,
            fields: row.fields ?? undefined,
            conditions: row.conditions ?? undefined,
            inverted: row.inverted ? true : undefined,
            reason: row.reason ?? undefined,
          }));

          return yield* Ability.fromRawRules<Subjects>(rawRules);
        });

      return {
        buildAbility,

        check: (
          userId: string,
          spaceId: string,
          request: Ability.CheckRequest<Subjects, Ability.AnyRule>,
        ): Effect.Effect<void, CheckError> =>
          buildAbility(userId, spaceId).pipe(Effect.flatMap((ability) => Ability.check(ability, request))),

        permittedFields: (
          userId: string,
          spaceId: string,
          request: Ability.CheckRequest<Subjects, Ability.AnyRule>,
          options: Ability.PermittedFieldsOptions<Ability.AnyRule>,
        ): Effect.Effect<ReadonlyArray<string>, PermittedFieldsError> =>
          buildAbility(userId, spaceId).pipe(
            Effect.flatMap((ability) => Ability.permittedFields(ability, request, options)),
          ),
      } as const;
    }),
  },
) {}

export namespace Authorization {
  export const layer = Layer.effect(Authorization, Authorization.make);
}
