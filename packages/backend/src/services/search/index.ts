import { Context, Effect, Layer, Match, Queue, Stream } from "effect";
import amqplib from "amqplib";
import Typesense from "typesense";

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
  readonly spaceId?: string;
  readonly createdAt: number;
};

export type CommentDocument = {
  readonly id: string;
  readonly content: string;
  readonly authorId: string;
  readonly postId: string;
  readonly spaceId?: string;
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

interface SearchResult<T> {
  readonly hits: ReadonlyArray<T>;
  readonly query: string;
  readonly estimatedTotalHits: number;
  readonly processingTimeMs: number;
}

export class Search extends Context.Service<Search>()("@openworks/backend/services/search/Search", {
  make: Effect.gen(function* () {
    const config = yield* Config;
    const database = yield* Database;

    const client = new Typesense.Client({
      nodes: [{ host: config.typesense.host, port: config.typesense.port, protocol: config.typesense.protocol }],
      apiKey: config.typesense.apiKey,
      connectionTimeoutSeconds: 2,
    });

    yield* Effect.tryPromise(() => client.health.retrieve());

    const {
      postsCollection: postsCollectionName,
      commentsCollection: commentsCollectionName,
      spacesCollection: spacesCollectionName,
      usersCollection: usersCollectionName,
      wikiPagesCollection: wikiPagesCollectionName,
      worksCollection: worksCollectionName,
      creatorsCollection: creatorsCollectionName,
    } = config.typesense;

    const collectionSchemas = [
      {
        name: postsCollectionName,
        fields: [
          { name: "title", type: "string" as const },
          { name: "content", type: "string" as const },
          { name: "authorId", type: "string" as const, facet: true },
          { name: "spaceId", type: "string" as const, facet: true, optional: true },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: commentsCollectionName,
        fields: [
          { name: "content", type: "string" as const },
          { name: "authorId", type: "string" as const, facet: true },
          { name: "postId", type: "string" as const, facet: true },
          { name: "spaceId", type: "string" as const, facet: true, optional: true },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: spacesCollectionName,
        fields: [
          { name: "name", type: "string" as const },
          { name: "slug", type: "string" as const },
          { name: "description", type: "string" as const },
          { name: "memberCount", type: "int32" as const },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: usersCollectionName,
        fields: [
          { name: "name", type: "string" as const },
          { name: "displayName", type: "string" as const },
          { name: "bio", type: "string" as const },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: wikiPagesCollectionName,
        fields: [
          { name: "title", type: "string" as const },
          { name: "content", type: "string" as const },
          { name: "spaceId", type: "string" as const, facet: true },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: worksCollectionName,
        fields: [
          { name: "title", type: "string" as const },
          { name: "originalTitle", type: "string" as const },
          { name: "description", type: "string" as const },
          { name: "aliases", type: "string" as const },
          { name: "type", type: "string" as const, facet: true },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
      {
        name: creatorsCollectionName,
        fields: [
          { name: "name", type: "string" as const },
          { name: "kind", type: "string" as const, facet: true },
          { name: "bio", type: "string" as const },
          { name: "createdAt", type: "int64" as const },
        ],
        default_sorting_field: "createdAt",
      },
    ];

    for (const schema of collectionSchemas) {
      yield* Effect.tryPromise(() => client.collections().create(schema)).pipe(Effect.ignore);
    }

    const applyChanges = <T extends { readonly id: string }>(
      collectionName: string,
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
          yield* Effect.tryPromise(() =>
            client.collections(collectionName).documents().delete({ filter_by: `id:[${deleteIds.join(",")}]` }),
          ).pipe(Effect.ignore);
        }

        if (documents.length > 0) {
          yield* Effect.tryPromise(() =>
            client.collections(collectionName).documents().import(documents, { action: "upsert" }),
          );
        }
      });

    const searchPosts = (options: SearchPostsOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<PostDocument>> => {
        const result = await client.collections<PostDocument>(postsCollectionName).documents().search({
          q: options.q,
          query_by: "title,content",
          filter_by: options.spaceId ? `spaceId:=${options.spaceId}` : undefined,
          sort_by: "createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchComments = (options: SearchCommentsOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<CommentDocument>> => {
        const filter =
          [
            options.postId ? `postId:=${options.postId}` : undefined,
            options.spaceId ? `spaceId:=${options.spaceId}` : undefined,
          ]
            .filter((f): f is string => f !== undefined)
            .join(" && ") || undefined;
        const result = await client.collections<CommentDocument>(commentsCollectionName).documents().search({
          q: options.q,
          query_by: "content",
          filter_by: filter,
          sort_by: "createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchSpaces = (options: SearchSpacesOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<SpaceDocument>> => {
        const result = await client.collections<SpaceDocument>(spacesCollectionName).documents().search({
          q: options.q,
          query_by: "name,slug,description",
          sort_by: "memberCount:desc,createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchUsers = (options: SearchUsersOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<UserDocument>> => {
        const result = await client.collections<UserDocument>(usersCollectionName).documents().search({
          q: options.q,
          query_by: "name,displayName,bio",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchWikiPages = (options: SearchWikiPagesOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<WikiPageDocument>> => {
        const result = await client.collections<WikiPageDocument>(wikiPagesCollectionName).documents().search({
          q: options.q,
          query_by: "title,content",
          filter_by: options.spaceId ? `spaceId:=${options.spaceId}` : undefined,
          sort_by: "createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchWorks = (options: SearchWorksOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<WorkDocument>> => {
        const result = await client.collections<WorkDocument>(worksCollectionName).documents().search({
          q: options.q,
          query_by: "title,originalTitle,description,aliases",
          filter_by: options.type ? `type:=${options.type}` : undefined,
          sort_by: "createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const searchCreators = (options: SearchCreatorsOptions) =>
      Effect.tryPromise(async (): Promise<SearchResult<CreatorDocument>> => {
        const result = await client.collections<CreatorDocument>(creatorsCollectionName).documents().search({
          q: options.q,
          query_by: "name,bio",
          sort_by: "createdAt:desc",
          per_page: options.limit,
          page: Math.floor(options.offset / options.limit) + 1,
        });
        return {
          hits: (result.hits ?? []).map((h) => h.document),
          query: options.q,
          estimatedTotalHits: result.found,
          processingTimeMs: result.search_time_ms,
        };
      });

    const reindexAll = Effect.gen(function* () {
      for (const schema of collectionSchemas) {
        yield* Effect.tryPromise(() => client.collections(schema.name).delete()).pipe(Effect.ignore);
        yield* Effect.tryPromise(() => client.collections().create(schema));
      }

      const postRows = yield* database.select().from(posts);
      if (postRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(postsCollectionName)
            .documents()
            .import(
              postRows.map((row) => ({
                id: row.id,
                title: row.title,
                content: row.content ? portableTextToPlainText(row.content) : "",
                authorId: row.authorId,
                spaceId: row.spaceId ?? undefined,
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const commentRows = yield* database.select().from(comments);
      if (commentRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(commentsCollectionName)
            .documents()
            .import(
              commentRows.map((row) => ({
                id: row.id,
                content: portableTextToPlainText(row.content),
                authorId: row.authorId,
                postId: row.postId,
                spaceId: row.spaceId ?? undefined,
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const spaceRows = yield* database.select().from(spaces);
      if (spaceRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(spacesCollectionName)
            .documents()
            .import(
              spaceRows.map((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                description: row.description ?? "",
                memberCount: row.memberCount,
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const userRows = yield* database.select().from(users);
      if (userRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(usersCollectionName)
            .documents()
            .import(
              userRows.map((row) => ({
                id: row.id,
                name: row.name,
                displayName: row.displayName ?? "",
                bio: row.bio ?? "",
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const wikiPageRows = yield* database.select().from(wikiPages);
      if (wikiPageRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(wikiPagesCollectionName)
            .documents()
            .import(
              wikiPageRows.map((row) => ({
                id: row.id,
                title: row.title,
                content: portableTextToPlainText(row.content),
                spaceId: row.spaceId,
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const workRows = yield* database.select().from(works);
      const aliasRows = workRows.length > 0 ? yield* database.select().from(workAliases) : [];
      const aliasesByWorkId = Map.groupBy(aliasRows, (row) => row.workId);
      if (workRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(worksCollectionName)
            .documents()
            .import(
              workRows.map((row) => ({
                id: row.id,
                title: row.title,
                originalTitle: row.originalTitle ?? "",
                description: row.description ? portableTextToPlainText(row.description) : "",
                aliases: (aliasesByWorkId.get(row.id) ?? []).map((a) => a.value).join(" "),
                type: row.type,
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
        );
      }

      const creatorRows = yield* database.select().from(creators);
      if (creatorRows.length > 0) {
        yield* Effect.tryPromise(() =>
          client
            .collections(creatorsCollectionName)
            .documents()
            .import(
              creatorRows.map((row) => ({
                id: row.id,
                name: row.name,
                kind: row.kind,
                bio: row.bio ? portableTextToPlainText(row.bio) : "",
                createdAt: row.createdAt.getTime(),
              })),
              { action: "upsert" },
            ),
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
      applyPostChanges: (changes: ReadonlyArray<PostChange>) => applyChanges(postsCollectionName, changes),
      applyCommentChanges: (changes: ReadonlyArray<CommentChange>) => applyChanges(commentsCollectionName, changes),
      applySpaceChanges: (changes: ReadonlyArray<SpaceChange>) => applyChanges(spacesCollectionName, changes),
      applyUserChanges: (changes: ReadonlyArray<UserChange>) => applyChanges(usersCollectionName, changes),
      applyWikiPageChanges: (changes: ReadonlyArray<WikiPageChange>) =>
        applyChanges(wikiPagesCollectionName, changes),
      applyWorkChanges: (changes: ReadonlyArray<WorkChange>) => applyChanges(worksCollectionName, changes),
      applyCreatorChanges: (changes: ReadonlyArray<CreatorChange>) => applyChanges(creatorsCollectionName, changes),
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

interface PendingMessage {
  readonly table: string;
  readonly content: Buffer;
  readonly ack: () => void;
  readonly nack: () => void;
}

export namespace Search {
  export const layer = Layer.effect(Search, Search.make);

  /**
   * 索引同步守护进程：消费 Sequin 从 Postgres WAL 捕获、
   * 经 RabbitMQ 投递的变更事件，逐条写入 Typesense。
   * 处理失败时 nack 并 requeue，由 RabbitMQ 重投；upsert/delete 幂等，
   * 因此 at-least-once 投递即可保证索引收敛。
   * 数据库写入是唯一的索引写入路径，API 层不直接写索引。
   */
  export const syncLayer = Layer.effectDiscard(
    Effect.gen(function* () {
      const config = yield* Config;
      const search = yield* Search;

      const connection = yield* Effect.acquireRelease(
        Effect.tryPromise(() => amqplib.connect(config.rabbitmq.url)),
        (conn) => Effect.promise(() => conn.close()),
      );

      const channel = yield* Effect.acquireRelease(
        Effect.tryPromise(async () => {
          const ch = await connection.createChannel();
          await ch.prefetch(1);
          return ch;
        }),
        (ch) => Effect.promise(() => ch.close()),
      );

      yield* Effect.tryPromise(() =>
        channel.assertExchange(config.rabbitmq.exchange, "topic", { durable: true }),
      );

      const tables = [
        "posts",
        "comments",
        "spaces",
        "users",
        "wiki_pages",
        "works",
        "creators",
        "work_aliases",
      ] as const;

      for (const table of tables) {
        const queue = `openworks-search.${table}`;
        yield* Effect.tryPromise(async () => {
          await channel.assertQueue(queue, { durable: true });
          await channel.bindQueue(
            queue,
            config.rabbitmq.exchange,
            `${config.rabbitmq.routingKeyPrefix}.${table}.*`,
          );
        });
      }

      const messages = Stream.callback<PendingMessage>((effectQueue) =>
        Effect.tryPromise(async () => {
          for (const table of tables) {
            await channel.consume(
              `openworks-search.${table}`,
              (msg) => {
                if (!msg) return;
                Queue.offerUnsafe(effectQueue, {
                  table,
                  content: msg.content,
                  ack: () => channel.ack(msg),
                  nack: () => channel.nack(msg, false, true),
                });
              },
              { noAck: false },
            );
          }
        }),
      );

      yield* Effect.forkScoped(
        Stream.runForEach(messages, ({ table, content, ack, nack }) =>
          Effect.gen(function* () {
            if (table === "posts") {
              const event: ChangeEvent<PostChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyPostChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyPostChanges([
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      title: event.record.title,
                      content: event.record.content ? portableTextToPlainText(event.record.content) : "",
                      authorId: event.record.author_id,
                      spaceId: event.record.space_id ?? undefined,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ]);
              }
            } else if (table === "comments") {
              const event: ChangeEvent<CommentChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyCommentChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyCommentChanges([
                  {
                    _tag: "Upsert",
                    document: {
                      id: event.record.id,
                      content: event.record.content ? portableTextToPlainText(event.record.content) : "",
                      authorId: event.record.author_id,
                      postId: event.record.post_id,
                      spaceId: event.record.space_id ?? undefined,
                      createdAt: new Date(event.record.created_at).getTime(),
                    },
                  },
                ]);
              }
            } else if (table === "spaces") {
              const event: ChangeEvent<SpaceChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applySpaceChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applySpaceChanges([
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
                ]);
              }
            } else if (table === "users") {
              const event: ChangeEvent<UserChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyUserChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyUserChanges([
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
                ]);
              }
            } else if (table === "wiki_pages") {
              const event: ChangeEvent<WikiPageChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyWikiPageChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyWikiPageChanges([
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
                ]);
              }
            } else if (table === "works") {
              const event: ChangeEvent<WorkChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyWorkChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyWorkChanges([
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
                ]);
              }
            } else if (table === "creators") {
              const event: ChangeEvent<CreatorChangeRow> = JSON.parse(content.toString());
              if (event.action === "delete") {
                yield* search.applyCreatorChanges([{ _tag: "Delete", id: event.record.id }]);
              } else {
                yield* search.applyCreatorChanges([
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
                ]);
              }
            } else if (table === "work_aliases") {
              const affectedWorkIds = new Set<string>();
              const event: ChangeEvent<WorkAliasChangeRow> = JSON.parse(content.toString());
              affectedWorkIds.add(event.record.work_id);
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
              onSuccess: () => Effect.sync(ack),
              onFailure: (cause) =>
                Effect.logWarning("Search: failed to apply change to index", cause).pipe(
                  Effect.andThen(Effect.sync(nack)),
                ),
            }),
          ),
        ),
      );

      yield* Effect.log("Search: consuming change events");
    }),
  );
}
