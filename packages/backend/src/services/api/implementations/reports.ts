import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { modLog } from "../../database/schema/moderation-log";
import { reports } from "../../database/schema/report";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { ReportEntry, ReportForbidden, ReportNotFound, ReportTargetNotFound } from "../interfaces/reports";

export const ReportsHandlers = HttpApiBuilder.group(
  Api,
  "reports",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
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

          const spaceId = target?.spaceId ?? null;

          if (!spaceId) {
            return yield* new ReportForbidden();
          }

          const space = yield* database.query.spaces.findFirst({
            where: { id: spaceId },
          });
          if (space && space.visibility === "private") {
            const membership = yield* database.query.spaceMembers.findFirst({
              where: {
                spaceId,
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
              spaceId,
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
          yield* authorization.check(user.id, query.spaceId, {
            action: "read",
            subject: "Report",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.reports.findMany({
            where: {
              spaceId: query.spaceId,
              status: query.status,
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
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
          yield* authorization.check(user.id, existing.spaceId, {
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
            spaceId: existing.spaceId,
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
