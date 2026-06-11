import { and, count, eq, sql } from "drizzle-orm";
import { Effect, Match } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { workCredits } from "../../database/schema/creator";
import { libraryItems } from "../../database/schema/library-item";
import { notifications } from "../../database/schema/notification";
import { workRevisions, works } from "../../database/schema/work";
import { workAliases } from "../../database/schema/work-alias";
import { chapterProgress, workChapters } from "../../database/schema/work-chapter";
import { workRatings } from "../../database/schema/work-rating";
import { workSystemRequirements } from "../../database/schema/work-system-requirement";
import { workTagApplications, workTags } from "../../database/schema/work-tag";
import { Search } from "../../search";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import {
  AliasConflict,
  ChapterNotFound,
  InvalidCredits,
  InvalidWorkPayload,
  TagConflict,
  Work,
  WorkAliasEntry,
  WorkChapterDetail,
  WorkChapterEntry,
  WorkCreditEntry,
  WorkForbidden,
  WorkNotFound,
  WorkRatingEntry,
  WorkRevisionEntry,
  WorkSearchResult,
  WorkSystemRequirementEntry,
  WorkTagEntry,
} from "../interfaces/works";

export const WorksHandlers = HttpApiBuilder.group(
  Api,
  "works",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;
    const search = yield* Search;
    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const sort = query.sort ?? "popular";

          const tagFilter = query.tag
            ? yield* Effect.gen(function* () {
                const tag = yield* database.query.workTags.findFirst({
                  where: { name: query.tag!.toLowerCase() },
                });
                if (!tag) return [] as string[];
                const applications = yield* database.query.workTagApplications.findMany({
                  where: { tagId: tag.id },
                });
                return applications.map((a) => a.workId);
              })
            : undefined;

          if (tagFilter !== undefined && tagFilter.length === 0) {
            return [];
          }

          const rows = yield* database.query.works.findMany({
            where: {
              targetWorkId: { isNull: true },
              type: query.type,
              id: tagFilter ? { in: tagFilter } : undefined,
            },
            orderBy: (table, { desc, sql: sqlFn }) =>
              Match.value(sort).pipe(
                Match.when("new", () => [desc(table.createdAt)]),
                Match.when("top", () => [
                  desc(
                    sqlFn`CASE WHEN ${table.ratingCount} = 0 THEN 0 ELSE ${table.ratingSum}::float / ${table.ratingCount} END`,
                  ),
                  desc(table.createdAt),
                ]),
                Match.orElse(() => [desc(table.libraryCount), desc(table.createdAt)]),
              ),
            limit,
            offset,
          });
          return rows.map((row) => new Work(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("search", ({ query }) =>
        Effect.gen(function* () {
          const limit = query.limit ?? config.pagination.searchDefaultLimit;
          const offset = query.offset ?? 0;

          const result = yield* search.searchWorks({ q: query.q, type: query.type, limit, offset });

          const ids = result.hits.map((hit) => hit.id);

          if (ids.length === 0) {
            return new WorkSearchResult({
              hits: [],
              query: result.query,
              estimatedTotalHits: result.estimatedTotalHits ?? 0,
              processingTimeMs: result.processingTimeMs,
              limit,
              offset,
            });
          }

          const rows = yield* database.query.works.findMany({
            where: { id: { in: ids } },
          });

          const rowMap = new Map(rows.map((row) => [row.id, row]));
          const hits = ids
            .map((id) => rowMap.get(id))
            .filter((row): row is (typeof rows)[number] => row !== undefined)
            .map((row) => new Work(row));

          return new WorkSearchResult({
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
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new WorkNotFound();
          }
          return new Work(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          if (payload.targetWorkId) {
            const target = yield* database.query.works.findFirst({
              where: { id: payload.targetWorkId },
            });
            if (!target) {
              return yield* new WorkNotFound();
            }
            if (target.targetWorkId !== null) {
              return yield* new InvalidWorkPayload();
            }
          }

          const id = v7();
          const [row] = yield* database
            .insert(works)
            .values({
              id,
              type: payload.type,
              title: payload.title,
              originalTitle: payload.originalTitle,
              description: payload.description,
              coverUrl: payload.coverUrl,
              releaseDate: payload.releaseDate,
              isbn: payload.isbn,
              pageCount: payload.pageCount,
              runtimeMinutes: payload.runtimeMinutes,
              seasonCount: payload.seasonCount,
              episodeCount: payload.episodeCount,
              platforms: payload.platforms ? [...payload.platforms] : undefined,
              website: payload.website,
              nsfw: payload.nsfw ?? false,
              targetWorkId: payload.targetWorkId,
              createdById: user.id,
            })
            .returning();

          return new Work(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }

          yield* database.insert(workRevisions).values({
            id: v7(),
            workId: params.id,
            editedById: user.id,
            snapshot: {
              title: existing.title,
              originalTitle: existing.originalTitle,
              description: existing.description,
              coverUrl: existing.coverUrl,
              releaseDate: existing.releaseDate,
              isbn: existing.isbn,
              pageCount: existing.pageCount,
              runtimeMinutes: existing.runtimeMinutes,
              seasonCount: existing.seasonCount,
              episodeCount: existing.episodeCount,
              platforms: existing.platforms,
              website: existing.website,
              nsfw: existing.nsfw,
            },
            reason: payload.reason,
          });

          const [row] = yield* database
            .update(works)
            .set({
              title: payload.title,
              originalTitle: payload.originalTitle,
              description: payload.description,
              coverUrl: payload.coverUrl,
              releaseDate: payload.releaseDate,
              isbn: payload.isbn,
              pageCount: payload.pageCount,
              runtimeMinutes: payload.runtimeMinutes,
              seasonCount: payload.seasonCount,
              episodeCount: payload.episodeCount,
              platforms:
                payload.platforms !== undefined
                  ? payload.platforms !== null
                    ? [...payload.platforms]
                    : null
                  : undefined,
              website: payload.website,
              nsfw: payload.nsfw,
            })
            .where(eq(works.id, params.id))
            .returning();

          if (existing.createdById && existing.createdById !== user.id) {
            yield* database.insert(notifications).values({
              id: v7(),
              userId: existing.createdById,
              type: "work_edited",
              title: `Your work "${existing.title}" was edited`,
              linkUrl: `/library/works/${params.id}`,
            });
          }

          return new Work(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          if (existing.createdById !== user.id) {
            return yield* new WorkForbidden();
          }
          yield* database.delete(works).where(eq(works.id, params.id));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getRevisions", ({ params, query }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.workRevisions.findMany({
            where: { workId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new WorkRevisionEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getVariants", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const rows = yield* database.query.works.findMany({
            where: { targetWorkId: params.id },
          });
          return rows.map((row) => new Work(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getCredits", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const rows = yield* database.query.workCredits.findMany({
            where: { workId: params.id },
            with: { creator: true },
            orderBy: { position: "asc" },
          });
          return rows
            .filter((row) => row.creator !== null)
            .map(
              (row) =>
                new WorkCreditEntry({
                  id: row.id,
                  workId: row.workId,
                  creatorId: row.creatorId,
                  creatorName: row.creator!.name,
                  creatorImageUrl: row.creator!.imageUrl,
                  role: row.role,
                  characterName: row.characterName,
                  position: row.position,
                }),
            );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("setCredits", ({ params, payload }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }

          const allowedRoles = config.library.creditRoles[existing.type];
          if (!allowedRoles) {
            return yield* new InvalidCredits();
          }
          for (const entry of payload) {
            if (!allowedRoles.includes(entry.role)) {
              return yield* new InvalidCredits();
            }
          }

          yield* database.delete(workCredits).where(eq(workCredits.workId, params.id));

          if (payload.length > 0) {
            yield* database.insert(workCredits).values(
              payload.map((entry, idx) => ({
                id: v7(),
                workId: params.id,
                creatorId: entry.creatorId,
                role: entry.role,
                characterName: entry.characterName,
                position: idx,
              })),
            );
          }

          const rows = yield* database.query.workCredits.findMany({
            where: { workId: params.id },
            with: { creator: true },
            orderBy: { position: "asc" },
          });
          return rows
            .filter((row) => row.creator !== null)
            .map(
              (row) =>
                new WorkCreditEntry({
                  id: row.id,
                  workId: row.workId,
                  creatorId: row.creatorId,
                  creatorName: row.creator!.name,
                  creatorImageUrl: row.creator!.imageUrl,
                  role: row.role,
                  characterName: row.characterName,
                  position: row.position,
                }),
            );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getMyRating", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const row = yield* database.query.workRatings.findFirst({
            where: { userId: user.id, workId: params.id },
          });
          return row ? new WorkRatingEntry(row) : null;
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("setRating", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          if (payload.value < config.library.ratingMin || payload.value > config.library.ratingMax) {
            return yield* new InvalidWorkPayload();
          }

          const existingRating = yield* database.query.workRatings.findFirst({
            where: { userId: user.id, workId: params.id },
          });

          if (existingRating) {
            const valueDelta = payload.value - existingRating.value;
            const oldIsRecommended = existingRating.value >= config.library.recommendThreshold;
            const newIsRecommended = payload.value >= config.library.recommendThreshold;
            const recommendedDelta = (newIsRecommended ? 1 : 0) - (oldIsRecommended ? 1 : 0);

            const [row] = yield* database
              .update(workRatings)
              .set({ value: payload.value })
              .where(eq(workRatings.id, existingRating.id))
              .returning();

            yield* database
              .update(works)
              .set({
                ratingSum: sql`${works.ratingSum} + ${valueDelta}`,
                recommendedCount: sql`${works.recommendedCount} + ${recommendedDelta}`,
              })
              .where(eq(works.id, params.id));

            return new WorkRatingEntry(row!);
          }

          const [row] = yield* database
            .insert(workRatings)
            .values({
              id: v7(),
              workId: params.id,
              userId: user.id,
              value: payload.value,
            })
            .returning();

          const recommendedDelta = payload.value >= config.library.recommendThreshold ? 1 : 0;

          yield* database
            .update(works)
            .set({
              ratingCount: sql`${works.ratingCount} + 1`,
              ratingSum: sql`${works.ratingSum} + ${payload.value}`,
              recommendedCount: sql`${works.recommendedCount} + ${recommendedDelta}`,
            })
            .where(eq(works.id, params.id));

          return new WorkRatingEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("deleteRating", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const existingRating = yield* database.query.workRatings.findFirst({
            where: { userId: user.id, workId: params.id },
          });
          if (!existingRating) {
            return;
          }

          yield* database.delete(workRatings).where(eq(workRatings.id, existingRating.id));

          const recommendedDelta = existingRating.value >= config.library.recommendThreshold ? -1 : 0;

          yield* database
            .update(works)
            .set({
              ratingCount: sql`greatest(${works.ratingCount} - 1, 0)`,
              ratingSum: sql`${works.ratingSum} - ${existingRating.value}`,
              recommendedCount: sql`greatest(${works.recommendedCount} + ${recommendedDelta}, 0)`,
            })
            .where(eq(works.id, params.id));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getTags", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }

          const rows = yield* database
            .select({
              tagId: workTagApplications.tagId,
              tagName: workTags.name,
              count: count(),
            })
            .from(workTagApplications)
            .innerJoin(workTags, eq(workTagApplications.tagId, workTags.id))
            .where(eq(workTagApplications.workId, params.id))
            .groupBy(workTagApplications.tagId, workTags.name);

          const myApplications = yield* database.query.workTagApplications.findMany({
            where: { workId: params.id, userId: user.id },
          });
          const myTagIds = new Set(myApplications.map((a) => a.tagId));

          return rows.map(
            (row) =>
              new WorkTagEntry({
                id: row.tagId,
                name: row.tagName,
                count: row.count,
                appliedByMe: myTagIds.has(row.tagId),
              }),
          );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("addTag", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }

          const normalizedName = payload.name.toLowerCase().trim();

          const existingTag = yield* database.query.workTags.findFirst({
            where: { name: normalizedName },
          });

          const tagId = existingTag
            ? existingTag.id
            : yield* Effect.gen(function* () {
                const id = v7();
                yield* database.insert(workTags).values({ id, name: normalizedName });
                return id;
              });

          const existingApplication = yield* database.query.workTagApplications.findFirst({
            where: { workId: params.id, tagId, userId: user.id },
          });
          if (existingApplication) {
            return yield* new TagConflict();
          }

          yield* database.insert(workTagApplications).values({
            id: v7(),
            workId: params.id,
            tagId,
            userId: user.id,
          });

          const [countResult] = yield* database
            .select({ count: count() })
            .from(workTagApplications)
            .where(and(eq(workTagApplications.workId, params.id), eq(workTagApplications.tagId, tagId)));

          return new WorkTagEntry({
            id: tagId,
            name: normalizedName,
            count: countResult?.count ?? 1,
            appliedByMe: true,
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("removeTag", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          yield* database
            .delete(workTagApplications)
            .where(
              and(
                eq(workTagApplications.workId, params.id),
                eq(workTagApplications.tagId, params.tagId),
                eq(workTagApplications.userId, user.id),
              ),
            );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("searchTags", ({ query }) =>
        Effect.gen(function* () {
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const rows = query.q
            ? yield* database.query.workTags.findMany({
                where: { name: { ilike: `%${query.q}%` } },
                limit,
              })
            : yield* database.query.workTags.findMany({ limit });
          return rows.map((row) => ({ id: row.id, name: row.name }));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getAliases", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const rows = yield* database.query.workAliases.findMany({
            where: { workId: params.id },
          });
          return rows.map((row) => new WorkAliasEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("addAlias", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const duplicate = yield* database.query.workAliases.findFirst({
            where: { workId: params.id, value: payload.value },
          });
          if (duplicate) {
            return yield* new AliasConflict();
          }
          const [row] = yield* database
            .insert(workAliases)
            .values({
              id: v7(),
              workId: params.id,
              value: payload.value,
              kind: payload.kind,
              createdById: user.id,
            })
            .returning();
          return new WorkAliasEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("removeAlias", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          yield* database.delete(workAliases).where(eq(workAliases.id, params.aliasId));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getChapters", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const rows = yield* database.query.workChapters.findMany({
            where: { workId: params.id },
            orderBy: { position: "asc" },
          });
          const progressRows = yield* database.query.chapterProgress.findMany({
            where: {
              userId: user.id,
              chapterId: { in: rows.map((r) => r.id) },
            },
          });
          const readChapterIds = new Set(progressRows.map((p) => p.chapterId));
          return rows.map(
            (row) =>
              new WorkChapterEntry({
                id: row.id,
                workId: row.workId,
                title: row.title,
                position: row.position,
                isRead: readChapterIds.has(row.id),
                createdAt: row.createdAt,
              }),
          );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("createChapter", ({ params, payload }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const [row] = yield* database
            .insert(workChapters)
            .values({
              id: v7(),
              workId: params.id,
              title: payload.title,
              position: payload.position ?? 0,
              content: payload.content,
            })
            .returning();
          return new WorkChapterDetail(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getChapter", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* database.query.workChapters.findFirst({
            where: { id: params.chapterId },
          });
          if (!row) {
            return yield* new ChapterNotFound();
          }
          return new WorkChapterDetail(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("updateChapter", ({ params, payload }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.workChapters.findFirst({
            where: { id: params.chapterId },
          });
          if (!existing) {
            return yield* new ChapterNotFound();
          }
          const [row] = yield* database
            .update(workChapters)
            .set({
              title: payload.title,
              position: payload.position,
              content: payload.content,
            })
            .where(eq(workChapters.id, params.chapterId))
            .returning();
          return new WorkChapterDetail(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("deleteChapter", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.workChapters.findFirst({
            where: { id: params.chapterId },
          });
          if (!existing) {
            return yield* new ChapterNotFound();
          }
          yield* database.delete(workChapters).where(eq(workChapters.id, params.chapterId));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("markChapterRead", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const chapter = yield* database.query.workChapters.findFirst({
            where: { id: params.chapterId },
          });
          if (!chapter) {
            return yield* new ChapterNotFound();
          }
          const existingProgress = yield* database.query.chapterProgress.findFirst({
            where: { userId: user.id, chapterId: params.chapterId },
          });
          if (!existingProgress) {
            yield* database.insert(chapterProgress).values({
              id: v7(),
              userId: user.id,
              chapterId: params.chapterId,
            });
          }
          yield* database
            .update(libraryItems)
            .set({ lastReadChapterId: params.chapterId })
            .where(and(eq(libraryItems.userId, user.id), eq(libraryItems.workId, chapter.workId)));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("unmarkChapterRead", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const chapter = yield* database.query.workChapters.findFirst({
            where: { id: params.chapterId },
          });
          if (!chapter) {
            return yield* new ChapterNotFound();
          }
          yield* database
            .delete(chapterProgress)
            .where(and(eq(chapterProgress.userId, user.id), eq(chapterProgress.chapterId, params.chapterId)));
          const libraryItem = yield* database.query.libraryItems.findFirst({
            where: { userId: user.id, workId: chapter.workId },
          });
          if (libraryItem && libraryItem.lastReadChapterId === params.chapterId) {
            yield* database
              .update(libraryItems)
              .set({ lastReadChapterId: null })
              .where(eq(libraryItems.id, libraryItem.id));
          }
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getRequirements", ({ params }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          const rows = yield* database.query.workSystemRequirements.findMany({
            where: { workId: params.id },
          });
          return rows.map((row) => new WorkSystemRequirementEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("setRequirements", ({ params, payload }) =>
        Effect.gen(function* () {
          const existing = yield* database.query.works.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new WorkNotFound();
          }
          if (existing.type !== "game") {
            return yield* new InvalidWorkPayload();
          }

          yield* database.delete(workSystemRequirements).where(eq(workSystemRequirements.workId, params.id));

          if (payload.length > 0) {
            yield* database.insert(workSystemRequirements).values(
              payload.map((entry) => ({
                id: v7(),
                workId: params.id,
                platform: entry.platform,
                tier: entry.tier,
                os: entry.os,
                cpu: entry.cpu,
                memory: entry.memory,
                graphics: entry.graphics,
                storage: entry.storage,
                notes: entry.notes,
              })),
            );
          }

          const rows = yield* database.query.workSystemRequirements.findMany({
            where: { workId: params.id },
          });
          return rows.map((row) => new WorkSystemRequirementEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
  }),
);
