import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Authorization } from "../../authorization";
import { Config } from "../../config";
import { Database } from "../../database";
import { wikiPages, wikiRevisions } from "../../database/schema/wiki";
import { Search } from "../../search";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import {
  WikiForbidden,
  WikiPageEntry,
  WikiPageNotFound,
  WikiPageSearchResult,
  WikiRevisionEntry,
  WikiSlugConflict,
} from "../interfaces/wiki";

export const WikiHandlers = HttpApiBuilder.group(
  Api,
  "wiki",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const authorization = yield* Authorization;
    const search = yield* Search;

    return handlers
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchWikiPages({ q: query.q, spaceId: query.spaceId, limit, offset });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new WikiPageSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.wikiPages.findMany({
            where: { id: { in: ids } },
          });

          const rowMap = new Map(rows.map((row) => [row.id, row]));
          const hits = ids
            .map((id) => rowMap.get(id))
            .filter((row): row is (typeof rows)[number] => row !== undefined)
            .map((row) => new WikiPageEntry(row));

          return new WikiPageSearchResult({
            hits,
            query: result.query,
            estimatedTotalHits: result.estimatedTotalHits ?? 0,
            processingTimeMs: result.processingTimeMs,
            limit,
            offset,
          });
        }).pipe(
          Effect.catchTag("UnknownError", () => new HttpApiError.InternalServerError()),
          Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError()),
        ),
      )
      .handle("listPages", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, query.spaceId, {
            action: "read",
            subject: "WikiPage",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.wikiPages.findMany({
            where: { spaceId: query.spaceId },
            orderBy: { title: "asc" },
            limit,
            offset,
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
          yield* authorization.check(user.id, row.spaceId, {
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
          yield* authorization.check(user.id, payload.spaceId, {
            action: "create",
            subject: "WikiPage",
          });
          const existing = yield* database.query.wikiPages.findFirst({
            where: {
              spaceId: payload.spaceId,
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
              spaceId: payload.spaceId,
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
          yield* authorization.check(user.id, existing.spaceId, {
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
          yield* authorization.check(user.id, existing.spaceId, {
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
      .handle("listRevisions", ({ params, query }) =>
        Effect.gen(function* () {
          const page = yield* database.query.wikiPages.findFirst({
            where: { id: params.id },
          });
          if (!page) {
            return yield* new WikiPageNotFound();
          }
          const user = yield* CurrentUser;
          yield* authorization.check(user.id, page.spaceId, {
            action: "read",
            subject: "WikiPage",
          });
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.wikiRevisions.findMany({
            where: { pageId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
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
