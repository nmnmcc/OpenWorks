import { Context, Config as C, Layer, Redacted } from "effect";

export class Config extends Context.Service<Config>()("@openworks/backend/services/config/Config", {
  make: C.all({
    server: C.all({
      port: C.port("PORT").pipe(C.withDefault(30000)),
      host: C.string("HOST").pipe(C.withDefault("0.0.0.0")),
    }),
    database: C.all({
      url: C.url("DATABASE_URL").pipe(C.map((u) => Redacted.make(u.toString()))),
    }),
    meilisearch: C.all({
      url: C.string("MEILI_URL").pipe(C.withDefault("http://127.0.0.1:7700")),
      apiKey: C.option(C.redacted("MEILI_MASTER_KEY")),
    }),
  }),
}) {}

export namespace Config {
  export const layer = Layer.effect(Config, Config.make);
}
