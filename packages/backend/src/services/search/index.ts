import { Meilisearch } from "meilisearch";
import { Context, Effect, Layer, Option, Redacted } from "effect";
import { Config } from "../config";

export class Search extends Context.Service<Search, Meilisearch>()("@openworks/backend/services/search/Search") {}

export namespace Search {
  export const layer = Layer.effect(
    Search,
    Effect.gen(function* () {
      const config = yield* Config;

      const apiKey = config.meilisearch.apiKey.pipe(Option.map(Redacted.value), Option.getOrUndefined);

      const client = new Meilisearch({
        host: config.meilisearch.url,
        apiKey,
      });

      yield* Effect.tryPromise(() => client.health());

      yield* Effect.tryPromise(() => client.createIndex("posts", { primaryKey: "id" })).pipe(
        Effect.flatMap((task) => Effect.tryPromise(() => client.tasks.waitForTask(task.taskUid))),
        Effect.ignore,
      );

      const settingsTask = yield* Effect.tryPromise(() =>
        client.index("posts").updateSettings({
          searchableAttributes: ["title", "content"],
          filterableAttributes: ["groupId", "authorId"],
          sortableAttributes: ["createdAt"],
        }),
      );
      yield* Effect.tryPromise(() => client.tasks.waitForTask(settingsTask.taskUid));

      return client;
    }),
  );
}
