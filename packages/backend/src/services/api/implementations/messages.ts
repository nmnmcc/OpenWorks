import { v7 } from "uuid";
import { Effect } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { eq } from "drizzle-orm";
import { Api, MessageEntry, MessageNotFound, MessageForbidden, RecipientNotFound, CurrentUser } from "../interfaces";
import { Database } from "../../database";
import { messages } from "../../database/schema";

export const MessagesHandlers = HttpApiBuilder.group(
  Api,
  "messages",
  Effect.fn(function* (handlers) {
    const database = yield* Database;

    return handlers
      .handle("inbox", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.messages.findMany({
            where: {
              recipientId: user.id,
              deletedByRecipient: false,
            },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new MessageEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("sent", () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const rows = yield* database.query.messages.findMany({
            where: {
              senderId: user.id,
              deletedBySender: false,
            },
            orderBy: { createdAt: "desc" },
          });
          return rows.map((row) => new MessageEntry(row));
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("getById", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const row = yield* database.query.messages.findFirst({
            where: { id: params.id },
          });
          if (!row) {
            return yield* new MessageNotFound();
          }
          if (row.senderId !== user.id && row.recipientId !== user.id) {
            return yield* new MessageForbidden();
          }
          return new MessageEntry(row);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("send", ({ payload }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const recipient = yield* database.query.users.findFirst({
            where: { id: payload.recipientId },
          });
          if (!recipient) {
            return yield* new RecipientNotFound();
          }
          const [row] = yield* database
            .insert(messages)
            .values({
              id: v7(),
              senderId: user.id,
              recipientId: payload.recipientId,
              subject: payload.subject,
              body: payload.body,
            })
            .returning();
          return new MessageEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("markRead", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.messages.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new MessageNotFound();
          }
          if (existing.recipientId !== user.id) {
            return yield* new MessageForbidden();
          }
          const [row] = yield* database
            .update(messages)
            .set({ isRead: true })
            .where(eq(messages.id, params.id))
            .returning();
          return new MessageEntry(row!);
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;
          const existing = yield* database.query.messages.findFirst({
            where: { id: params.id },
          });
          if (!existing) {
            return yield* new MessageNotFound();
          }
          if (existing.senderId !== user.id && existing.recipientId !== user.id) {
            return yield* new MessageForbidden();
          }
          if (existing.senderId === user.id) {
            yield* database.update(messages).set({ deletedBySender: true }).where(eq(messages.id, params.id));
          }
          if (existing.recipientId === user.id) {
            yield* database.update(messages).set({ deletedByRecipient: true }).where(eq(messages.id, params.id));
          }
        }).pipe(Effect.catchTag("EffectDrizzleQueryError", () => new HttpApiError.InternalServerError())),
      );
  }),
);
