import { Config as C, Context, Layer, Redacted } from "effect";

export class Config extends Context.Service<Config>()("@openworks/backend/services/config/Config", {
  make: C.all({
    server: C.all({
      port: C.port("PORT").pipe(C.withDefault(30000)),
      host: C.string("HOST").pipe(C.withDefault("0.0.0.0")),
      baseURL: C.string("BETTER_AUTH_URL").pipe(C.withDefault("http://localhost:30000")),
      corsOrigins: C.string("CORS_ORIGINS").pipe(
        C.withDefault("http://localhost:3000"),
        C.map((origins) => origins.split(",")),
      ),
    }),
    database: C.all({
      url: C.url("DATABASE_URL").pipe(C.map((u) => Redacted.make(u.toString()))),
    }),
    meilisearch: C.all({
      url: C.string("MEILI_URL").pipe(C.withDefault("http://127.0.0.1:17700")),
      apiKey: C.option(C.redacted("MEILI_MASTER_KEY")),
      postsIndex: C.string("MEILI_POSTS_INDEX").pipe(C.withDefault("posts")),
      commentsIndex: C.string("MEILI_COMMENTS_INDEX").pipe(C.withDefault("comments")),
      spacesIndex: C.string("MEILI_SPACES_INDEX").pipe(C.withDefault("spaces")),
      usersIndex: C.string("MEILI_USERS_INDEX").pipe(C.withDefault("users")),
      wikiPagesIndex: C.string("MEILI_WIKI_PAGES_INDEX").pipe(C.withDefault("wiki_pages")),
      worksIndex: C.string("MEILI_WORKS_INDEX").pipe(C.withDefault("works")),
      creatorsIndex: C.string("MEILI_CREATORS_INDEX").pipe(C.withDefault("creators")),
    }),
    kafka: C.all({
      brokers: C.string("KAFKA_BROKERS").pipe(
        C.withDefault("127.0.0.1:19092"),
        C.map((brokers) => brokers.split(",")),
      ),
      consumerGroup: C.string("KAFKA_CONSUMER_GROUP").pipe(C.withDefault("openworks-search")),
      postsTopic: C.string("KAFKA_POSTS_TOPIC").pipe(C.withDefault("openworks.public.posts")),
      commentsTopic: C.string("KAFKA_COMMENTS_TOPIC").pipe(C.withDefault("openworks.public.comments")),
      spacesTopic: C.string("KAFKA_SPACES_TOPIC").pipe(C.withDefault("openworks.public.spaces")),
      usersTopic: C.string("KAFKA_USERS_TOPIC").pipe(C.withDefault("openworks.public.users")),
      wikiPagesTopic: C.string("KAFKA_WIKI_PAGES_TOPIC").pipe(C.withDefault("openworks.public.wiki_pages")),
      worksTopic: C.string("KAFKA_WORKS_TOPIC").pipe(C.withDefault("openworks.public.works")),
      creatorsTopic: C.string("KAFKA_CREATORS_TOPIC").pipe(C.withDefault("openworks.public.creators")),
      workAliasesTopic: C.string("KAFKA_WORK_ALIASES_TOPIC").pipe(C.withDefault("openworks.public.work_aliases")),
    }),
    s3: C.option(
      C.all({
        endpoint: C.string("S3_ENDPOINT"),
        accessKeyId: C.redacted("S3_ACCESS_KEY_ID"),
        secretAccessKey: C.redacted("S3_SECRET_ACCESS_KEY"),
        bucket: C.string("S3_BUCKET").pipe(C.withDefault("openworks")),
        region: C.string("S3_REGION").pipe(C.withDefault("garage")),
      }),
    ),
    media: C.all({
      allowedTypes: C.succeed<Record<string, string>>({
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/avif": "avif",
        "image/svg+xml": "svg",
      }),
      maxUploadSizeBytes: C.number("MEDIA_MAX_UPLOAD_SIZE").pipe(C.withDefault(10 * 1024 * 1024)),
      cacheMaxAgeSeconds: C.number("MEDIA_CACHE_MAX_AGE").pipe(C.withDefault(31536000)),
      publicBaseUrl: C.string("MEDIA_PUBLIC_BASE_URL").pipe(C.withDefault("http://openworks.web.localhost:13903")),
      presignExpirySeconds: C.number("MEDIA_PRESIGN_EXPIRY").pipe(C.withDefault(600)),
    }),
    pagination: C.all({
      defaultLimit: C.number("PAGINATION_DEFAULT_LIMIT").pipe(C.withDefault(25)),
      maxLimit: C.number("PAGINATION_MAX_LIMIT").pipe(C.withDefault(100)),
      searchDefaultLimit: C.number("PAGINATION_SEARCH_DEFAULT_LIMIT").pipe(C.withDefault(20)),
    }),
    hotScoring: C.all({
      decayDivisor: C.number("HOT_SCORING_DECAY_DIVISOR").pipe(C.withDefault(45000)),
    }),
    library: C.all({
      ratingMin: C.number("LIBRARY_RATING_MIN").pipe(C.withDefault(1)),
      ratingMax: C.number("LIBRARY_RATING_MAX").pipe(C.withDefault(10)),
      recommendThreshold: C.number("LIBRARY_RECOMMEND_THRESHOLD").pipe(C.withDefault(6)),
      creditRoles: C.succeed<Record<string, ReadonlyArray<string>>>({
        book: ["author", "co-author", "illustrator", "translator", "editor", "publisher"],
        movie: ["director", "writer", "actor", "composer", "producer", "studio"],
        tv: ["director", "writer", "actor", "composer", "producer", "studio"],
        game: ["developer", "publisher", "designer", "writer", "composer"],
      }),
      requirementPlatforms: C.succeed<ReadonlyArray<string>>(["windows", "macos", "linux"]),
    }),
    invitation: C.all({
      tokenBytes: C.number("INVITATION_TOKEN_BYTES").pipe(C.withDefault(32)),
      expiryMs: C.number("INVITATION_EXPIRY_MS").pipe(C.withDefault(7 * 24 * 60 * 60 * 1000)),
    }),
  }),
}) {}

export namespace Config {
  export const layer = Layer.effect(Config, Config.make);
}
