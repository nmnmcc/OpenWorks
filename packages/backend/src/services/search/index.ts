import { Context, Effect, Layer, Match, Option, Queue, Redacted, Stream } from "effect";
import { Kafka, logLevel } from "kafkajs";
import type { KafkaMessage } from "kafkajs";
import { Meilisearch } from "meilisearch";
import type { Index, SearchResponse } from "meilisearch";

import { portableTextToPlainText } from "../../libraries/portable-text";
import type { PortableTextBlock } from "../../libraries/portable-text";
import { Config } from "../config";
import { Database } from "../database";
import { users } from "../database/schema/auth";
import { comments } from "../database/schema/comment";
import { posts } from "../database/schema/post";
import { spaces } from "../database/schema/space";
import { wikiPages } from "../database/schema/wiki";
import { creators } from "../database/schema/creator";
import { works } from "../database/schema/work";
import { workAliases } from "../database/schema/work-alias";

export type PostDocument = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly authorId: string;
  readonly spaceId: string | null;
  readonly createdAt: number;
};

export type CommentDocument = {
  readonly id: string;
  readonly content: string;
  readonly authorId: string;
  readonly postId: string;
  readonly spaceId: string | null;
  readonly createdAt: number;
};

export type SpaceDocument = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly memberCount: number;
  readonly createdAt: number;
};

export type UserDocument = {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly bio: string;
  readonly createdAt: number;
};

export type WikiPageDocument = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly spaceId: string;
  readonly createdAt: number;
};

export type WorkDocument = {
  readonly id: string;
  readonly title: string;
  readonly originalTitle: string;
  readonly description: string;
  readonly aliases: string;
  readonly type: string;
  readonly createdAt: number;
};

export type CreatorDocument = {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly bio: string;
  readonly createdAt: number;
};

export interface SearchWorksOptions {
  readonly q: string;
  readonly type?: string | undefined;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchCreatorsOptions {
  readonly q: string;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchPostsOptions {
  readonly q: string;
  readonly spaceId?: string | undefined;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchCommentsOptions {
  readonly q: string;
  readonly postId?: string | undefined;
  readonly spaceId?: string | undefined;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchSpacesOptions {
  readonly q: string;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchUsersOptions {
  readonly q: string;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchWikiPagesOptions {
  readonly q: string;
  readonly spaceId?: string | undefined;
  readonly limit: number;
  readonly offset: number;
}

type DocumentChange<T> =
  | { readonly _tag: "Upsert"; readonly document: T }
  | { readonly _tag: "Delete"; readonly id: string };

export type PostChange = DocumentChange<PostDocument>;
export type CommentChange = DocumentChange<CommentDocument>;
export type SpaceChange = DocumentChange<SpaceDocument>;
export type UserChange = DocumentChange<UserDocument>;
export type WikiPageChange = DocumentChange<WikiPageDocument>;
export type WorkChange = DocumentChange<WorkDocument>;
export type CreatorChange = DocumentChange<CreatorDocument>;

const applyChangesToIndex = <T extends { readonly id: string }>(
  index: Index<T>,
  changes: ReadonlyArray<DocumentChange<T>>,
) =>
  Effect.gen(function* () {
    const latestById = new Map<string, DocumentChange<T>>();
    for (const change of changes) {
      const id = Match.value(change).pipe(
        Match.tag("Upsert", (c) => c.document.id),
        Match.tag("Delete", (c) => c.id),
        Match.exhaustive,
      );
      latestById.set(id, change);
    }

    const deleteIds: string[] = [];
    const documents: T[] = [];

    for (const [, change] of latestById) {
      Match.value(change).pipe(
        Match.tag("Delete", (c) => deleteIds.push(c.id)),
        Match.tag("Upsert", (c) => documents.push(c.document)),
        Match.exhaustive,
      );
    }

    if (deleteIds.length > 0) {
      yield* Effect.tryPromise(() => index.deleteDocuments(deleteIds));
    }

    if (documents.length > 0) {
      yield* Effect.tryPromise(() => index.addDocuments(documents));
    }
  });

export class Search extends Context.Service<Search>()("@openworks/backend/services/search/Search", {
  make: Effect.gen(function* () {
    const config = yield* Config;
    const database = yield* Database;

    const apiKey = config.meilisearch.apiKey.pipe(Option.map(Redacted.value), Option.getOrUndefined);

    const client = new Meilisearch({
      host: config.meilisearch.url,
      apiKey,
    });

    yield* Effect.tryPromise(() => client.health());

    const {
      postsIndex: postsIndexName,
      commentsIndex: commentsIndexName,
      spacesIndex: spacesIndexName,
      usersIndex: usersIndexName,
      wikiPagesIndex: wikiPagesIndexName,
      worksIndex: worksIndexName,
      creatorsIndex: creatorsIndexName,
    } = config.meilisearch;

    yield* Effect.tryPromise(() => client.createIndex(postsIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(commentsIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(spacesIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(usersIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(wikiPagesIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(worksIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );
    yield* Effect.tryPromise(() => client.createIndex(creatorsIndexName, { primaryKey: "id" }).waitTask()).pipe(
      Effect.ignore,
    );

    yield* Effect.tryPromise(() =>
      client
        .index(postsIndexName)
        .updateSettings({
          searchableAttributes: ["title", "content"],
          filterableAttributes: ["spaceId", "authorId"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(commentsIndexName)
        .updateSettings({
          searchableAttributes: ["content"],
          filterableAttributes: ["postId", "spaceId", "authorId"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(spacesIndexName)
        .updateSettings({
          searchableAttributes: ["name", "slug", "description"],
          sortableAttributes: ["memberCount", "createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(usersIndexName)
        .updateSettings({
          searchableAttributes: ["name", "displayName", "bio"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(wikiPagesIndexName)
        .updateSettings({
          searchableAttributes: ["title", "content"],
          filterableAttributes: ["spaceId"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(worksIndexName)
        .updateSettings({
          searchableAttributes: ["title", "originalTitle", "description", "aliases"],
          filterableAttributes: ["type"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    yield* Effect.tryPromise(() =>
      client
        .index(creatorsIndexName)
        .updateSettings({
          searchableAttributes: ["name", "bio"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask(),
    );

    const postsIndex = client.index<PostDocument>(postsIndexName);
    const commentsIndex = client.index<CommentDocument>(commentsIndexName);
    const spacesIndex = client.index<SpaceDocument>(spacesIndexName);
    const usersIndex = client.index<UserDocument>(usersIndexName);
    const wikiPagesIndex = client.index<WikiPageDocument>(wikiPagesIndexName);
    const worksIndex = client.index<WorkDocument>(worksIndexName);
    const creatorsIndex = client.index<CreatorDocument>(creatorsIndexName);

    const searchPosts = (options: SearchPostsOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<PostDocument>> =>
          postsIndex.search(options.q, {
            filter: options.spaceId ? `spaceId = "${options.spaceId}"` : undefined,
            sort: ["createdAt:desc"],
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const searchComments = (options: SearchCommentsOptions) =>
      Effect.tryPromise((): Promise<SearchResponse<CommentDocument>> => {
        const filter =
          [
            options.postId ? `postId = "${options.postId}"` : undefined,
            options.spaceId ? `spaceId = "${options.spaceId}"` : undefined,
          ]
            .filter((f): f is string => f !== undefined)
            .join(" AND ") || undefined;
        return commentsIndex.search(options.q, {
          filter,
          sort: ["createdAt:desc"],
          limit: options.limit,
          offset: options.offset,
        });
      });

    const searchSpaces = (options: SearchSpacesOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<SpaceDocument>> =>
          spacesIndex.search(options.q, {
            sort: ["memberCount:desc", "createdAt:desc"],
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const searchUsers = (options: SearchUsersOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<UserDocument>> =>
          usersIndex.search(options.q, {
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const searchWikiPages = (options: SearchWikiPagesOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<WikiPageDocument>> =>
          wikiPagesIndex.search(options.q, {
            filter: options.spaceId ? `spaceId = "${options.spaceId}"` : undefined,
            sort: ["createdAt:desc"],
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const searchWorks = (options: SearchWorksOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<WorkDocument>> =>
          worksIndex.search(options.q, {
            filter: options.type ? `type = "${options.type}"` : undefined,
            sort: ["createdAt:desc"],
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const searchCreators = (options: SearchCreatorsOptions) =>
      Effect.tryPromise(
        (): Promise<SearchResponse<CreatorDocument>> =>
          creatorsIndex.search(options.q, {
            sort: ["createdAt:desc"],
            limit: options.limit,
            offset: options.offset,
          }),
      );

    const reindexAll = Effect.gen(function* () {
      yield* Effect.tryPromise(() => postsIndex.deleteAllDocuments().waitTask());
      const postRows = yield* database.select().from(posts);
      if (postRows.length > 0) {
        yield* Effect.tryPromise(() =>
          postsIndex
            .addDocuments(
              postRows.map(
                (row): PostDocument => ({
                  id: row.id,
                  title: row.title,
                  content: row.content ? portableTextToPlainText(row.content) : "",
                  authorId: row.authorId,
                  spaceId: row.spaceId,
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => commentsIndex.deleteAllDocuments().waitTask());
      const commentRows = yield* database.select().from(comments);
      if (commentRows.length > 0) {
        yield* Effect.tryPromise(() =>
          commentsIndex
            .addDocuments(
              commentRows.map(
                (row): CommentDocument => ({
                  id: row.id,
                  content: portableTextToPlainText(row.content),
                  authorId: row.authorId,
                  postId: row.postId,
                  spaceId: row.spaceId,
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => spacesIndex.deleteAllDocuments().waitTask());
      const spaceRows = yield* database.select().from(spaces);
      if (spaceRows.length > 0) {
        yield* Effect.tryPromise(() =>
          spacesIndex
            .addDocuments(
              spaceRows.map(
                (row): SpaceDocument => ({
                  id: row.id,
                  name: row.name,
                  slug: row.slug,
                  description: row.description ?? "",
                  memberCount: row.memberCount,
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => usersIndex.deleteAllDocuments().waitTask());
      const userRows = yield* database.select().from(users);
      if (userRows.length > 0) {
        yield* Effect.tryPromise(() =>
          usersIndex
            .addDocuments(
              userRows.map(
                (row): UserDocument => ({
                  id: row.id,
                  name: row.name,
                  displayName: row.displayName ?? "",
                  bio: row.bio ?? "",
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => wikiPagesIndex.deleteAllDocuments().waitTask());
      const wikiPageRows = yield* database.select().from(wikiPages);
      if (wikiPageRows.length > 0) {
        yield* Effect.tryPromise(() =>
          wikiPagesIndex
            .addDocuments(
              wikiPageRows.map(
                (row): WikiPageDocument => ({
                  id: row.id,
                  title: row.title,
                  content: portableTextToPlainText(row.content),
                  spaceId: row.spaceId,
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => worksIndex.deleteAllDocuments().waitTask());
      const workRows = yield* database.select().from(works);
      const aliasRows = workRows.length > 0 ? yield* database.select().from(workAliases) : [];
      const aliasesByWorkId = Map.groupBy(aliasRows, (row) => row.workId);
      if (workRows.length > 0) {
        yield* Effect.tryPromise(() =>
          worksIndex
            .addDocuments(
              workRows.map(
                (row): WorkDocument => ({
                  id: row.id,
                  title: row.title,
                  originalTitle: row.originalTitle ?? "",
                  description: row.description ? portableTextToPlainText(row.description) : "",
                  aliases: (aliasesByWorkId.get(row.id) ?? []).map((a) => a.value).join(" "),
                  type: row.type,
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      yield* Effect.tryPromise(() => creatorsIndex.deleteAllDocuments().waitTask());
      const creatorRows = yield* database.select().from(creators);
      if (creatorRows.length > 0) {
        yield* Effect.tryPromise(() =>
          creatorsIndex
            .addDocuments(
              creatorRows.map(
                (row): CreatorDocument => ({
                  id: row.id,
                  name: row.name,
                  kind: row.kind,
                  bio: row.bio ? portableTextToPlainText(row.bio) : "",
                  createdAt: row.createdAt.getTime(),
                }),
              ),
            )
            .waitTask(),
        );
      }

      return {
        posts: postRows.length,
        comments: commentRows.length,
        spaces: spaceRows.length,
        users: userRows.length,
        wikiPages: wikiPageRows.length,
        works: workRows.length,
        creators: creatorRows.length,
      };
    });

    return {
      searchPosts,
      searchComments,
      searchSpaces,
      searchUsers,
      searchWikiPages,
      searchWorks,
      searchCreators,
      applyPostChanges: (changes: ReadonlyArray<PostChange>) => applyChangesToIndex(postsIndex, changes),
      applyCommentChanges: (changes: ReadonlyArray<CommentChange>) => applyChangesToIndex(commentsIndex, changes),
      applySpaceChanges: (changes: ReadonlyArray<SpaceChange>) => applyChangesToIndex(spacesIndex, changes),
      applyUserChanges: (changes: ReadonlyArray<UserChange>) => applyChangesToIndex(usersIndex, changes),
      applyWikiPageChanges: (changes: ReadonlyArray<WikiPageChange>) => applyChangesToIndex(wikiPagesIndex, changes),
      applyWorkChanges: (changes: ReadonlyArray<WorkChange>) => applyChangesToIndex(worksIndex, changes),
      applyCreatorChanges: (changes: ReadonlyArray<CreatorChange>) => applyChangesToIndex(creatorsIndex, changes),
      reindexAll,
    };
  }),
}) {}

interface PostChangeRow {
  readonly id: string;
  readonly title: string;
  readonly content: ReadonlyArray<typeof PortableTextBlock.Type> | null;
  readonly author_id: string;
  readonly space_id: string | null;
  readonly created_at: string;
}

interface CommentChangeRow {
  readonly id: string;
  readonly content: ReadonlyArray<typeof PortableTextBlock.Type>;
  readonly author_id: string;
  readonly post_id: string;
  readonly space_id: string | null;
  readonly created_at: string;
}

interface SpaceChangeRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly member_count: number;
  readonly created_at: string;
}

interface UserChangeRow {
  readonly id: string;
  readonly name: string;
  readonly display_name: string | null;
  readonly bio: string | null;
  readonly created_at: string;
}

interface WikiPageChangeRow {
  readonly id: string;
  readonly title: string;
  readonly content: ReadonlyArray<typeof PortableTextBlock.Type>;
  readonly space_id: string;
  readonly created_at: string;
}

interface WorkChangeRow {
  readonly id: string;
  readonly title: string;
  readonly original_title: string | null;
  readonly description: ReadonlyArray<typeof PortableTextBlock.Type> | null;
  readonly type: string;
  readonly created_at: string;
}

interface CreatorChangeRow {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly bio: ReadonlyArray<typeof PortableTextBlock.Type> | null;
  readonly created_at: string;
}

interface WorkAliasChangeRow {
  readonly id: string;
  readonly work_id: string;
  readonly value: string;
}

interface ChangeEvent<TRow> {
  readonly action: "insert" | "update" | "delete" | "read";
  readonly record: TRow;
}

interface PendingBatch {
  readonly topic: string;
  readonly messages: ReadonlyArray<KafkaMessage>;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

export namespace Search {
  export const layer = Layer.effect(Search, Search.make);

  /**
   * 索引同步守护进程：消费 Sequin 从 Postgres WAL 捕获、
   * 经 Kafka 投递的变更事件，按批写入 Meilisearch。
   * 处理失败时不前进消费位点，由 Kafka 重投；upsert/delete 幂等，
   * 因此 at-least-once 投递即可保证索引收敛。
   * 数据库写入是唯一的索引写入路径，API 层不直接写索引。
   */
  export const syncLayer = Layer.effectDiscard(
    Effect.gen(function* () {
      const config = yield* Config;
      const search = yield* Search;

      const kafka = new Kafka({
        clientId: "openworks-backend",
        brokers: config.kafka.brokers,
        logLevel: logLevel.ERROR,
      });

      const consumer = yield* Effect.acquireRelease(
        Effect.tryPromise(async () => {
          const consumer = kafka.consumer({ groupId: config.kafka.consumerGroup });
          await consumer.connect();
          await consumer.subscribe({
            topics: [
              config.kafka.postsTopic,
              config.kafka.commentsTopic,
              config.kafka.spacesTopic,
              config.kafka.usersTopic,
              config.kafka.wikiPagesTopic,
              config.kafka.worksTopic,
              config.kafka.creatorsTopic,
              config.kafka.workAliasesTopic,
            ],
            fromBeginning: true,
          });
          return consumer;
        }),
        (consumer) => Effect.promise(() => consumer.disconnect()),
      );

      const batches = Stream.callback<PendingBatch>((queue) =>
        Effect.tryPromise(() =>
          consumer.run({
            eachBatch: ({ batch }) =>
              new Promise((resolve, reject) => {
                Queue.offerUnsafe(queue, { topic: batch.topic, messages: batch.messages, resolve, reject });
              }),
          }),
        ),
      );

      yield* Effect.forkScoped(
        Stream.runForEach(batches, ({ topic, messages, resolve, reject }) =>
          Effect.gen(function* () {
            if (topic === config.kafka.postsTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<PostChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<PostChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      title: event.record.title,
                      content: event.record.content ? portableTextToPlainText(event.record.content) : "",
                      authorId: event.record.author_id,
                      spaceId: event.record.space_id,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyPostChanges(changes);
            } else if (topic === config.kafka.commentsTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<CommentChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<CommentChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      content: event.record.content ? portableTextToPlainText(event.record.content) : "",
                      authorId: event.record.author_id,
                      postId: event.record.post_id,
                      spaceId: event.record.space_id,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyCommentChanges(changes);
            } else if (topic === config.kafka.spacesTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<SpaceChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<SpaceChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      name: event.record.name,
                      slug: event.record.slug,
                      description: event.record.description ?? "",
                      memberCount: event.record.member_count,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applySpaceChanges(changes);
            } else if (topic === config.kafka.usersTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<UserChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<UserChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      name: event.record.name,
                      displayName: event.record.display_name ?? "",
                      bio: event.record.bio ?? "",
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyUserChanges(changes);
            } else if (topic === config.kafka.wikiPagesTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<WikiPageChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<WikiPageChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      title: event.record.title,
                      content: portableTextToPlainText(event.record.content),
                      spaceId: event.record.space_id,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyWikiPageChanges(changes);
            } else if (topic === config.kafka.worksTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<WorkChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<WorkChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      title: event.record.title,
                      originalTitle: event.record.original_title ?? "",
                      description: event.record.description
                        ? portableTextToPlainText(event.record.description)
                        : "",
                      aliases: "",
                      type: event.record.type,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyWorkChanges(changes);
            } else if (topic === config.kafka.creatorsTopic) {
              const changes = messages.flatMap((message): ReadonlyArray<CreatorChange> => {
                if (!message.value) return [];
                const event: ChangeEvent<CreatorChangeRow> = JSON.parse(message.value.toString());
                if (event.action === "delete") return [{ _tag: "Delete", id: event.record.id }];
                return [
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      name: event.record.name,
                      kind: event.record.kind,
                      bio: event.record.bio ? portableTextToPlainText(event.record.bio) : "",
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ];
              });
              yield* search.applyCreatorChanges(changes);
            } else if (topic === config.kafka.workAliasesTopic) {
              const affectedWorkIds = new Set<string>();
              for (const message of messages) {
                if (!message.value) continue;
                const event: ChangeEvent<WorkAliasChangeRow> = JSON.parse(message.value.toString());
                affectedWorkIds.add(event.record.work_id);
              }
              if (affectedWorkIds.size > 0) {
                const database = yield* Database;
                const workIds = [...affectedWorkIds];
                const workRows = yield* database.query.works.findMany({
                  where: { id: { in: workIds } },
                });
                const aliasRows = yield* database.query.workAliases.findMany({
                  where: { workId: { in: workIds } },
                });
                const aliasesByWorkId = Map.groupBy(aliasRows, (row) => row.workId);
                const changes: ReadonlyArray<WorkChange> = workRows.map((row) => ({
                  _tag: "Upsert",
                  document: {
                    id: row.id,
                    title: row.title,
                    originalTitle: row.originalTitle ?? "",
                    description: row.description ? portableTextToPlainText(row.description) : "",
                    aliases: (aliasesByWorkId.get(row.id) ?? []).map((a) => a.value).join(" "),
                    type: row.type,
                    createdAt: row.createdAt.getTime(),
                  },
                }));
                yield* search.applyWorkChanges(changes);
              }
            }
          }).pipe(
            Effect.matchCauseEffect({
              onSuccess: () => Effect.sync(resolve),
              onFailure: (cause) =>
                Effect.logWarning("Search: failed to apply changes to index", cause).pipe(
                  Effect.andThen(Effect.sync(() => reject(cause))),
                ),
            }),
          ),
        ),
      );

      yield* Effect.log("Search: consuming change events");
    }),
  );
}
