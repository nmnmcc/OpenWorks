import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { shelfItems, shelves } from "../../database/schema/shelf";
import { Api } from "../interfaces";
import { CurrentUser } from "../interfaces/middlewares/auth";
import {
  ShelfEntry,
  ShelfForbidden,
  ShelfItemConflict,
  ShelfItemEntry,
  ShelfNotFound,
  ShelfWorkNotFound,
} from "../interfaces/shelves";
import { Work } from "../interfaces/works";

export const ShelvesHandlers = HttpApiBuilder.group(
  Api,
  "shelves",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const ownerId = query.ownerId ?? user.id;
          const isOwner = ownerId === user.id;

          if (query.workId) {
            const items = yield* database.query.shelfItems.findMany({
              where: { workId: query.workId },
            });
            const shelfIds = items.map((item) => item.shelfId);
            if (shelfIds.length === 0) {
              return [];
            }
            const rows = yield* database.query.shelves.findMany({
              where: {
                id: { in: shelfIds },
                ownerId,
                isPublic: isOwner ? undefined : true,
              },
              orderBy: { createdAt: "desc" },
              limit,
              offset,
            });
            return rows.map((row) => new ShelfEntry(row));
          }

          const rows = yield* database.query.shelves.findMany({
            where: {
              ownerId,
              isPublic: isOwner ? undefined : true,
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new ShelfEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const row = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new ShelfNotFound();
          }
          if (!row.isPublic && row.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          return new ShelfEntry(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getItems", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const shelf = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!shelf) {
            return yield* new ShelfNotFound();
          }
          if (!shelf.isPublic && shelf.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.shelfItems.findMany({
            where: { shelfId: params.id },
            with: { work: true },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.flatMap((row) => {
            if (!row.work) return [];
            return [
              new ShelfItemEntry({
                ...row,
                work: new Work(row.work),
              }),
            ];
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const [row] = yield* database
            .insert(shelves)
            .values({
              id: v7(),
              ownerId: user.id,
              name: payload.name,
              description: payload.description,
              isPublic: payload.isPublic ?? true,
            })
            .returning();
          return new ShelfEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const shelf = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!shelf) {
            return yield* new ShelfNotFound();
          }
          if (shelf.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          const [updated] = yield* database
            .update(shelves)
            .set({
              name: payload.name,
              description: payload.description,
              isPublic: payload.isPublic,
            })
            .where(eq(shelves.id, params.id))
            .returning();
          return new ShelfEntry(updated!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const shelf = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!shelf) {
            return yield* new ShelfNotFound();
          }
          if (shelf.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          yield* database.delete(shelves).where(eq(shelves.id, params.id));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("addItem", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const shelf = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!shelf) {
            return yield* new ShelfNotFound();
          }
          if (shelf.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          const work = yield* database.query.works.findFirst({
            where: { id: payload.workId },
          });
          if (!work) {
            return yield* new ShelfWorkNotFound();
          }
          const existing = yield* database.query.shelfItems.findFirst({
            where: {
              shelfId: params.id,
              workId: payload.workId,
            },
          });
          if (existing) {
            return yield* new ShelfItemConflict();
          }
          const [row] = yield* database
            .insert(shelfItems)
            .values({
              id: v7(),
              shelfId: params.id,
              workId: payload.workId,
              note: payload.note,
            })
            .returning();
          yield* database
            .update(shelves)
            .set({ itemCount: sql`${shelves.itemCount} + 1` })
            .where(eq(shelves.id, params.id));
          return new ShelfItemEntry({
            ...row!,
            work: new Work(work),
          });
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("removeItem", ({ params, query }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const shelf = yield* database.query.shelves.findFirst({
            where: { id: params.id },
          });
          if (!shelf) {
            return yield* new ShelfNotFound();
          }
          if (shelf.ownerId !== user.id) {
            return yield* new ShelfForbidden();
          }
          const rows = yield* database
            .delete(shelfItems)
            .where(and(eq(shelfItems.shelfId, params.id), eq(shelfItems.workId, query.workId)))
            .returning();
          if (rows.length > 0) {
            yield* database
              .update(shelves)
              .set({ itemCount: sql`greatest(${shelves.itemCount} - 1, 0)` })
              .where(eq(shelves.id, params.id));
          }
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
