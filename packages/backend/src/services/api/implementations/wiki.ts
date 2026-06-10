import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import {
  Api,
  WikiPageEntry,
  WikiRevisionEntry,
  WikiPageNotFound,
  WikiForbidden,
  WikiSlugConflict,
  CurrentUser,
} from "../interfaces";
import { Database } from "../../database";
import { Authorization } from "../../authorization";
import { wikiPages, wikiRevisions } from "../../database/schema";

export const WikiHandlers = HttpApiBuilder.group(
  Api,
  "wiki",
  Effect.fn(function* (handlers) {
    const database = yield* Database;
    const authorization = yield* Authorization;

    return handlers
      .handle("listPages", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, query.groupId, {
            action: "read",
            subject: "WikiPage",
          });
          const rows = yield* database.query.wikiPages.findMany({
            where: { groupId: query.groupId },
            orderBy: { title: "asc" },
          });
          return rows.map((row) => new WikiPageEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("getPage", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* database.query.wikiPages.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new WikiPageNotFound();
          }
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, row.groupId, {
            action: "read",
            subject: "WikiPage",
          });
          return new WikiPageEntry(row);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("createPage", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, payload.groupId, {
            action: "create",
            subject: "WikiPage",
          });
          const existing = yield* database.query.wikiPages.findFirst({
            where: {
              groupId: payload.groupId,
              slug: payload.slug,
            },
          });
          if (existing) {
            return yield* new WikiSlugConflict();
          }
          const [row] = yield* database
            .insert(wikiPages)
            .values({
              id: v7(),
              groupId: payload.groupId,
              slug: payload.slug,
              title: payload.title,
              content: payload.content,
              lastEditedById: user.id,
            })
            .returning();
          yield* database.insert(wikiRevisions).values({
            id: v7(),
            pageId: row!.id,
            content: payload.content,
            editedById: user.id,
          });
          return new WikiPageEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("updatePage", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.wikiPages.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WikiPageNotFound();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "update",
            subject: "WikiPage",
          });
          const [row] = yield* database
            .update(wikiPages)
            .set({
              title: payload.title,
              content: payload.content,
              lastEditedById: user.id,
            })
            .where(eq(wikiPages.id, params.id))
            .returning();
          if (payload.content) {
            yield* database.insert(wikiRevisions).values({
              id: v7(),
              pageId: params.id,
              content: payload.content,
              editedById: user.id,
              reason: payload.reason,
            });
          }
          return new WikiPageEntry(row!);
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("deletePage", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.wikiPages.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WikiPageNotFound();
          }
          yield* authorization.check(user.id, existing.groupId, {
            action: "manage",
            subject: "WikiPage",
          });
          yield* database.delete(wikiPages).where(eq(wikiPages.id, params.id));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listRevisions", ({ params }) =>
        Effect.gen(function* () {
          const page = yield* database.query.wikiPages.findFirst({
            where: { id: params.id },
          });
          if (!page) {
            return yield* new WikiPageNotFound();
          }
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, page.groupId, {
            action: "read",
            subject: "WikiPage",
          });
          const rows = yield* database.query.wikiRevisions.findMany({
            where: { pageId: params.id },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new WikiRevisionEntry(row));
        }).pipe(
          Effect.catchTag("AuthorizationError", () => new WikiForbidden()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("AliasError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("RawRuleError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("ConditionError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("SubjectDetectionError", () => new HttpApiError.InternalServerError()),
        ),
      );
  }),
);
