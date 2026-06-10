import { Client } from "pg";
import { Effect, Layer, Queue, Redacted, Stream } from "effect";
import { sql, inArray, lte, asc } from "drizzle-orm";
import { Config } from "../config";
import { Database } from "../database";
import { Search } from "../search";
import { posts, searchOutbox } from "../database/schema";
import { portableTextToPlainText } from "../../libraries/portable-text";

const CHANNEL = "posts_changes";

const installTrigger = (database: typeof Database.Service) =>
  database.execute(sql`
		CREATE OR REPLACE FUNCTION posts_notify_changes() RETURNS trigger AS $$
		BEGIN
			IF TG_OP = 'DELETE' THEN
				INSERT INTO search_outbox (operation, post_id)
					VALUES ('DELETE', OLD.id);
				PERFORM pg_notify('posts_changes', '');
				RETURN OLD;
			ELSE
				INSERT INTO search_outbox (operation, post_id)
					VALUES (TG_OP, NEW.id);
				PERFORM pg_notify('posts_changes', '');
				RETURN NEW;
			END IF;
		END;
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS posts_changes_trigger ON posts;

		CREATE TRIGGER posts_changes_trigger
			AFTER INSERT OR UPDATE OR DELETE ON posts
			FOR EACH ROW EXECUTE FUNCTION posts_notify_changes();
	`);

const drainOutbox = (database: typeof Database.Service, search: typeof Search.Service) =>
  Effect.gen(function* () {
    const entries = yield* database.select().from(searchOutbox).orderBy(asc(searchOutbox.id));

    if (entries.length === 0) return;

    const maxId = entries[entries.length - 1]!.id;

    const latestByPost = new Map<string, (typeof entries)[number]>();
    for (const entry of entries) {
      latestByPost.set(entry.postId, entry);
    }

    const deleteIds: string[] = [];
    const upsertIds: string[] = [];

    for (const [, entry] of latestByPost) {
      if (entry.operation === "DELETE") {
        deleteIds.push(entry.postId);
      } else {
        upsertIds.push(entry.postId);
      }
    }

    if (deleteIds.length > 0) {
      yield* Effect.tryPromise(() =>
        search.index("posts").deleteDocuments({
          filter: `id IN [${deleteIds.map((id) => `"${id}"`).join(", ")}]`,
        }),
      );
    }

    if (upsertIds.length > 0) {
      const rows = yield* database.select().from(posts).where(inArray(posts.id, upsertIds));

      if (rows.length > 0) {
        const documents = rows.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content ? portableTextToPlainText(row.content) : "",
          authorId: row.authorId,
          groupId: row.groupId,
          createdAt: row.createdAt.toISOString(),
        }));

        yield* Effect.tryPromise(() => search.index("posts").addDocuments(documents));
      }
    }

    yield* database.delete(searchOutbox).where(lte(searchOutbox.id, maxId));
  }).pipe(
    Effect.catchTag("UnknownError", () => Effect.logWarning("CDC: failed to sync to search index")),
    Effect.catchTag("EffectDrizzleQueryError", () => Effect.logWarning("CDC: failed to read outbox")),
  );

export const CdcLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const config = yield* Config;
    const database = yield* Database;
    const search = yield* Search;
    const connectionString = Redacted.value(config.database.url);

    yield* installTrigger(database).pipe(
      Effect.catchTag("EffectDrizzleQueryError", () => Effect.logWarning("CDC: failed to install trigger")),
    );

    yield* drainOutbox(database, search);

    const listener = yield* Effect.acquireRelease(
      Effect.tryPromise(async () => {
        const client = new Client({ connectionString });
        await client.connect();
        await client.query(`LISTEN ${CHANNEL}`);
        return client;
      }),
      (client) => Effect.promise(() => client.end()),
    );

    const notifications = Stream.callback<void>((queue) =>
      Effect.sync(() => {
        listener.on("notification", (msg) => {
          if (msg.channel === CHANNEL) {
            Queue.offerUnsafe(queue, undefined);
          }
        });
      }),
    );

    yield* Effect.forkScoped(Stream.runForEach(notifications, () => drainOutbox(database, search)));

    yield* Effect.forkScoped(
      Effect.forever(Effect.sleep("30 seconds").pipe(Effect.andThen(drainOutbox(database, search)))),
    );

    yield* Effect.log("CDC: listening for post changes");
  }),
);
