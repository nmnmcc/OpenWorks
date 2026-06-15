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
    typesense: C.all({
      host: C.string("TYPESENSE_HOST").pipe(C.withDefault("127.0.0.1")),
      port: C.number("TYPESENSE_PORT").pipe(C.withDefault(8108)),
      protocol: C.string("TYPESENSE_PROTOCOL").pipe(C.withDefault("http")),
      apiKey: C.string("TYPESENSE_API_KEY").pipe(C.withDefault("openworks-dev-key")),
      postsCollection: C.string("TYPESENSE_POSTS_COLLECTION").pipe(C.withDefault("posts")),
      commentsCollection: C.string("TYPESENSE_COMMENTS_COLLECTION").pipe(C.withDefault("comments")),
      spacesCollection: C.string("TYPESENSE_SPACES_COLLECTION").pipe(C.withDefault("spaces")),
      usersCollection: C.string("TYPESENSE_USERS_COLLECTION").pipe(C.withDefault("users")),
      wikiPagesCollection: C.string("TYPESENSE_WIKI_PAGES_COLLECTION").pipe(C.withDefault("wiki_pages")),
      worksCollection: C.string("TYPESENSE_WORKS_COLLECTION").pipe(C.withDefault("works")),
      creatorsCollection: C.string("TYPESENSE_CREATORS_COLLECTION").pipe(C.withDefault("creators")),
    }),
    rabbitmq: C.all({
      url: C.string("RABBITMQ_URL").pipe(C.withDefault("amqp://guest:guest@127.0.0.1:5672")),
      exchange: C.string("RABBITMQ_EXCHANGE").pipe(C.withDefault("openworks.cdc")),
      routingKeyPrefix: C.string("RABBITMQ_ROUTING_KEY_PREFIX").pipe(
        C.withDefault("sequin.openworks.public"),
      ),
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
