import { Ability } from "@nmnmcc/ability";
import { Context, Effect, Layer } from "effect";
import { and, eq } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Database } from "../database";
import { groupMembers, permissions, rolePermissions } from "../database/schema";
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
      const db = yield* Database;

      const buildAbility = (userId: string, groupId: string): Effect.Effect<AuthorizationAbility, BuildAbilityError> =>
        Effect.gen(function* () {
          const rows = yield* db
            .select({
              action: permissions.action,
              subject: permissions.subject,
              fields: permissions.fields,
              conditions: permissions.conditions,
              inverted: permissions.inverted,
              reason: permissions.reason,
            })
            .from(groupMembers)
            .innerJoin(rolePermissions, eq(groupMembers.roleId, rolePermissions.roleId))
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId)));

          const rawRules: ReadonlyArray<
            Ability.RawRule<string, Ability.RuleSubject<Subjects>, string, Ability.MongoCondition<any>>
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
          groupId: string,
          request: Ability.CheckRequest<Subjects, Ability.AnyRule>,
        ): Effect.Effect<void, CheckError> =>
          buildAbility(userId, groupId).pipe(Effect.flatMap((ability) => Ability.check(ability, request))),

        permittedFields: (
          userId: string,
          groupId: string,
          request: Ability.CheckRequest<Subjects, Ability.AnyRule>,
          options: Ability.PermittedFieldsOptions<Ability.AnyRule>,
        ): Effect.Effect<ReadonlyArray<string>, PermittedFieldsError> =>
          buildAbility(userId, groupId).pipe(
            Effect.flatMap((ability) => Ability.permittedFields(ability, request, options)),
          ),
      } as const;
    }),
  },
) {}

export namespace Authorization {
  export const layer = Layer.effect(Authorization, Authorization.make);
}
