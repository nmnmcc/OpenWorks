import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import { Api, ReportEntry, ReportNotFound, ReportForbidden, ReportTargetNotFound, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { reports, modLog } from "../../database/schema";

export const ReportsHandlers = HttpApiBuilder.group(
  Api,
  "reports",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("create", ({ payload }) =>
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

          if ((payload.postId || payload.commentId) && !target) {
            return yield* new ReportTargetNotFound();
          }

          const groupId = target?.groupId ?? null;

          if (!groupId) {
            return yield* new ReportForbidden();
          }

          const group = yield* database.query.groups.findFirst({
            where: { id: groupId },
          });
          if (group && group.visibility === "private") {
            const membership = yield* database.query.groupMembers.findFirst({
              where: {
                groupId,
                userId: user.id,
              },
            });
            if (!membership) {
              return yield* new ReportTargetNotFound();
            }
          }

          const [row] = yield* database
            .insert(reports)
            .values({
              id: v7(),
              groupId,
              reporterId: user.id,
              postId: payload.postId,
              commentId: payload.commentId,
              reason: payload.reason,
            })
            .returning();
          return new ReportEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, query.groupId, {
            action: "read",
            subject: "Report",
          });
          const rows = yield* database.query.reports.findMany({
            where: query.status ? { groupId: query.groupId, status: query.status } : { groupId: query.groupId },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new ReportEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new ReportForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("resolve", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.reports.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new ReportNotFound();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "Report",
          });
          const [row] = yield* database
            .update(reports)
            .set({
              status: payload.status,
              resolvedById: user.id,
              resolutionNote: payload.resolutionNote,
            })
            .where(eq(reports.id, params.id))
            .returning();
          yield* database.insert(modLog).values({
            id: v7(),
            groupId: existing.groupId,
            moderatorId: user.id,
            action: "report_resolve",
            targetType: "report",
            targetId: params.id,
            details: {
              status: payload.status,
              resolutionNote: payload.resolutionNote ?? null,
            },
          });
          return new ReportEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new ReportForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
