import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Database } from "../../database";
import { creatorRevisions, creators } from "../../database/schema/creator";
import { Api } from "../interfaces";
import { Creator, CreatorNotFound, CreatorRevisionEntry, CreatorWorksEntry } from "../interfaces/creators";
import { CurrentUser } from "../interfaces/middlewares/auth";
import { Work } from "../interfaces/works";

export const CreatorsHandlers = HttpApiBuilder.group(
  Api,
  "creators",
  Effect.fn(function* (handlers) {
    const config = yield* Config;
    const database = yield* Database;

    return handlers
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.creators.findMany({
            where: query.q ? { name: { ilike: `%${query.q}%` } } : undefined,
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new Creator(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* database.query.creators.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new CreatorNotFound();
          }
          return new Creator(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getWorks", ({ params, query }) =>
        Effect.gen(function* () {
          const creator = yield* database.query.creators.findFirst({
            where: { id: params.id },
          });
          if (!creator) {
            return yield* new CreatorNotFound();
          }
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const credits = yield* database.query.workCredits.findMany({
            where: { creatorId: params.id },
            with: { work: true },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          const grouped = new Map<string, { work: NonNullable<typeof credits[number]["work"]>; roles: Array<string> }>();
          for (const credit of credits) {
            if (!credit.work) continue;
            const existing = grouped.get(credit.workId);
            if (existing) {
              existing.roles.push(credit.role);
            } else {
              grouped.set(credit.workId, { work: credit.work, roles: [credit.role] });
            }
          }
          return Array.from(grouped.values()).map(
            (entry) =>
              new CreatorWorksEntry({
                work: new Work(entry.work),
                roles: entry.roles,
              }),
          );
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const [row] = yield* database
            .insert(creators)
            .values({
              id: v7(),
              name: payload.name,
              kind: payload.kind,
              bio: payload.bio,
              imageUrl: payload.imageUrl,
              createdById: user.id,
            })
            .returning();
          return new Creator(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.creators.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new CreatorNotFound();
          }
          yield* database
            .insert(creatorRevisions)
            .values({
              id: v7(),
              creatorId: params.id,
              editedById: user.id,
              snapshot: {
                name: existing.name,
                kind: existing.kind,
                bio: existing.bio,
                imageUrl: existing.imageUrl,
              },
              reason: payload.reason,
            });
          const [updated] = yield* database
            .update(creators)
            .set({
              name: payload.name,
              kind: payload.kind,
              bio: payload.bio,
              imageUrl: payload.imageUrl,
            })
            .where(eq(creators.id, params.id))
            .returning();
          return new Creator(updated!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getRevisions", ({ params, query }) =>
        Effect.gen(function* () {
          const creator = yield* database.query.creators.findFirst({
            where: { id: params.id },
          });
          if (!creator) {
            return yield* new CreatorNotFound();
          }
          const limit = Math.min(query.limit ?? config.pagination.defaultLimit, config.pagination.maxLimit);
          const offset = query.offset ?? 0;
          const rows = yield* database.query.creatorRevisions.findMany({
            where: { creatorId: params.id },
            orderBy: { createdAt: "desc" },
            limit,
            offset,
          });
          return rows.map((row) => new CreatorRevisionEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
