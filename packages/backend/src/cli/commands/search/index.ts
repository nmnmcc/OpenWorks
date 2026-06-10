import { Console, Effect } from "effect";
import { Command } from "effect/unstable/cli";
import { Database } from "../../../services/database";
import { Search } from "../../../services/search";
import { posts, searchOutbox } from "../../../services/database/schema";
import { portableTextToPlainText } from "../../../libraries/portable-text";

const reindex = Command.make("reindex").pipe(
  Command.withDescription("Reindex all posts in Meilisearch"),
  Command.withHandler(
    Effect.fnUntraced(function* () {
      const database = yield* Database;
      const search = yield* Search;

      yield* Console.log("Clearing outbox and search index...");
      yield* database.delete(searchOutbox);
      const deleteTask = yield* Effect.tryPromise(() => search.index("posts").deleteAllDocuments());
      yield* Effect.tryPromise(() => search.tasks.waitForTask(deleteTask.taskUid));

      yield* Console.log("Fetching posts from database...");
      const rows = yield* database.select().from(posts);

      if (rows.length === 0) {
        yield* Console.log("No posts to index");
        return;
      }

      const documents = rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content ? portableTextToPlainText(row.content) : "",
        authorId: row.authorId,
        groupId: row.groupId,
        createdAt: row.createdAt.toISOString(),
      }));

      yield* Console.log(`Indexing ${documents.length} posts...`);
      const addTask = yield* Effect.tryPromise(() => search.index("posts").addDocuments(documents));
      yield* Effect.tryPromise(() => search.tasks.waitForTask(addTask.taskUid));

      yield* Console.log(`Reindexed ${documents.length} posts`);
    }),
  ),
);

export const searchCommand = Command.make("search").pipe(
  Command.withDescription("Search index management commands"),
  Command.withSubcommands([reindex]),
);
