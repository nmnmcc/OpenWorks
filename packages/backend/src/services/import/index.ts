import { Context, Effect, Layer, Option, Redacted, Schema } from "effect";

import { Config } from "../config";

export class ImportNotFound extends Schema.TaggedErrorClass<ImportNotFound>()("ImportNotFound", {}, { httpApiStatus: 404 }) {}

export class ImportNotConfigured extends Schema.TaggedErrorClass<ImportNotConfigured>()(
  "ImportNotConfigured",
  {},
  { httpApiStatus: 501 },
) {}

export class ImportSourceUnavailable extends Schema.TaggedErrorClass<ImportSourceUnavailable>()(
  "ImportSourceUnavailable",
  {},
  { httpApiStatus: 502 },
) {}

export type ImportPreviewData = {
  readonly title: string;
  readonly originalTitle?: string | undefined;
  readonly description?: string | undefined;
  readonly coverUrl?: string | undefined;
  readonly releaseDate?: string | undefined;
  readonly type: string;
  readonly isbn?: string | undefined;
  readonly pageCount?: number | undefined;
  readonly runtimeMinutes?: number | undefined;
  readonly seasonCount?: number | undefined;
  readonly episodeCount?: number | undefined;
  readonly url?: string | undefined;
};

const stripHtmlTags = (html: string): string => html.replace(/<[^>]*>/g, "").trim();

export class ExternalImport extends Context.Service<ExternalImport>()(
  "@openworks/backend/services/import/ExternalImport",
  {
    make: Effect.gen(function* () {
      const config = yield* Config;

      const lookupGoogleBooks = (isbn: string): Effect.Effect<ImportPreviewData, ImportNotFound | ImportSourceUnavailable> =>
        Effect.gen(function* () {
          const url = `${config.import.googleBooksBaseUrl}/volumes?q=isbn:${encodeURIComponent(isbn)}`;
          const response = yield* Effect.tryPromise({
            try: () => fetch(url).then((r) => r.json()),
            catch: () => new ImportSourceUnavailable(),
          });
          const items = (response as any)?.items;
          if (!Array.isArray(items) || items.length === 0) {
            return yield* new ImportNotFound();
          }
          const vol = items[0].volumeInfo;
          return {
            title: vol.title ?? isbn,
            originalTitle: undefined,
            description: vol.description ? stripHtmlTags(vol.description) : undefined,
            coverUrl: vol.imageLinks?.thumbnail?.replace("http://", "https://") ?? undefined,
            releaseDate: vol.publishedDate ?? undefined,
            type: "book",
            isbn,
            pageCount: vol.pageCount ?? undefined,
            url: vol.infoLink ?? undefined,
          };
        });

      const lookupTmdb = (
        mediaType: "movie" | "tv",
        tmdbId: string,
      ): Effect.Effect<ImportPreviewData, ImportNotFound | ImportNotConfigured | ImportSourceUnavailable> =>
        Effect.gen(function* () {
          const apiKey = Option.getOrUndefined(config.import.tmdbApiKey.pipe(Option.map(Redacted.value)));
          if (apiKey === undefined) {
            return yield* new ImportNotConfigured();
          }
          const url = `${config.import.tmdbBaseUrl}/${mediaType}/${encodeURIComponent(tmdbId)}?api_key=${apiKey}`;
          const response = yield* Effect.tryPromise({
            try: () => fetch(url).then((r) => r.json()),
            catch: () => new ImportSourceUnavailable(),
          });
          const data = response as any;
          if (data.success === false || !data.id) {
            return yield* new ImportNotFound();
          }
          const title = mediaType === "movie" ? data.title : data.name;
          const originalTitle = mediaType === "movie" ? data.original_title : data.original_name;
          const releaseDate = mediaType === "movie" ? data.release_date : data.first_air_date;
          return {
            title: title ?? tmdbId,
            originalTitle: originalTitle !== title ? originalTitle : undefined,
            description: data.overview ?? undefined,
            coverUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
            releaseDate: releaseDate ?? undefined,
            type: mediaType,
            runtimeMinutes: mediaType === "movie" ? (data.runtime ?? undefined) : undefined,
            seasonCount: mediaType === "tv" ? (data.number_of_seasons ?? undefined) : undefined,
            episodeCount: mediaType === "tv" ? (data.number_of_episodes ?? undefined) : undefined,
            url: `https://www.themoviedb.org/${mediaType}/${data.id}`,
          };
        });

      const lookupSteam = (
        appId: string,
      ): Effect.Effect<
        { readonly preview: ImportPreviewData; readonly requirements: ReadonlyArray<{ platform: string; tier: string; notes: string }> },
        ImportNotFound | ImportSourceUnavailable
      > =>
        Effect.gen(function* () {
          const url = `${config.import.steamStoreBaseUrl}/appdetails?appids=${encodeURIComponent(appId)}`;
          const response = yield* Effect.tryPromise({
            try: () => fetch(url).then((r) => r.json()),
            catch: () => new ImportSourceUnavailable(),
          });
          const entry = (response as any)?.[appId];
          if (!entry?.success || !entry.data) {
            return yield* new ImportNotFound();
          }
          const data = entry.data;
          const requirements: Array<{ platform: string; tier: string; notes: string }> = [];
          for (const platform of ["pc", "mac", "linux"] as const) {
            const key = `${platform}_requirements` as const;
            const reqs = data[key];
            if (reqs?.minimum) {
              requirements.push({
                platform: platform === "pc" ? "windows" : platform === "mac" ? "macos" : "linux",
                tier: "minimum",
                notes: stripHtmlTags(reqs.minimum),
              });
            }
            if (reqs?.recommended) {
              requirements.push({
                platform: platform === "pc" ? "windows" : platform === "mac" ? "macos" : "linux",
                tier: "recommended",
                notes: stripHtmlTags(reqs.recommended),
              });
            }
          }
          const platforms: string[] = [];
          if (data.platforms?.windows) platforms.push("windows");
          if (data.platforms?.mac) platforms.push("macos");
          if (data.platforms?.linux) platforms.push("linux");
          return {
            preview: {
              title: data.name ?? appId,
              originalTitle: undefined,
              description: data.short_description ? stripHtmlTags(data.short_description) : undefined,
              coverUrl: data.header_image ?? undefined,
              releaseDate: data.release_date?.date ?? undefined,
              type: "game",
              url: `https://store.steampowered.com/app/${appId}`,
            },
            requirements,
          };
        });

      return {
        lookupGoogleBooks,
        lookupTmdb,
        lookupSteam,
      } as const;
    }),
  },
) {}

export namespace ExternalImport {
  export const layer = Layer.effect(ExternalImport, ExternalImport.make);
}
