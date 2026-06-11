import { Console, Effect } from "effect";
import { Command } from "effect/unstable/cli";

import { Search } from "../../../services/search";

const reindex = Command.make("reindex").pipe(
  Command.withDescription("Reindex all resources in Meilisearch"),
  Command.withHandler(
    Effect.fnUntraced(function* () {
      const search = yield* Search;

      yield* Console.log("Reindexing all resources...");
      const counts = yield* search.reindexAll;
      yield* Console.log(
        `Reindexed ${counts.posts} posts, ${counts.comments} comments, ${counts.spaces} spaces, ${counts.users} users, ${counts.wikiPages} wiki pages, ${counts.works} works, ${counts.creators} creators`,
      );
    }),
  ),
);

export const searchCommand = Command.make("search").pipe(
  Command.withDescription("Search index management commands"),
  Command.withSubcommands([reindex]),
);
