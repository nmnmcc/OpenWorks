import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { libraryItems } from "../../database/schema/library-item";
import { works } from "../../database/schema/work";
import { Api } from "../interfaces";
import { LibraryItemEntry, LibraryWorkNotFound } from "../interfaces/library";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { Work } from "../interfaces/works";

export const LibraryHandlers = HttpApiBuilder.group(
  Api,
  "library",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.libraryItems.findMany({
            where: {
              userId: query.userId ?? user.id,
              status: query.status,
              workId: query.workId,
            },
            with: { work: true },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.flatMap((row) => {
            if (!row.work) return [];
            return [
              new LibraryItemEntry({
                ...row,
                work: new Work(row.work),
              }),
            ];
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("upsert", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const work = yield* database.query.works.findFirst({
            where: { id: payload.workId },
          });
          if (!work) {
            return yield* new LibraryWorkNotFound();
          }
          const existing = yield* database.query.libraryItems.findFirst({
            where: {
              userId: user.id,
              workId: payload.workId,
            },
          });
          if (existing) {
            const [updated] = yield* database
              .update(libraryItems)
              .set({ status: payload.status })
              .where(eq(libraryItems.id, existing.id))
              .returning();
            return new LibraryItemEntry({
              ...updated!,
              work: new Work(work),
            });
          }
          const [row] = yield* database
            .insert(libraryItems)
            .values({
              id: v7(),
              userId: user.id,
              workId: payload.workId,
              status: payload.status,
            })
            .returning();
          yield* database
            .update(works)
            .set({ libraryCount: sql`${works.libraryCount} + 1` })
            .where(eq(works.id, payload.workId));
          return new LibraryItemEntry({
            ...row!,
            work: new Work(work),
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("remove", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database
            .delete(libraryItems)
            .where(and(eq(libraryItems.userId, user.id), eq(libraryItems.workId, query.workId)))
            .returning();
          if (rows.length > 0) {
            yield* database
              .update(works)
              .set({ libraryCount: sql`greatest(${works.libraryCount} - 1, 0)` })
              .where(eq(works.id, query.workId));
          }
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
