import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Effect, Option, Redacted } from "effect";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";
import { v7 } from "uuid";

import { Config } from "../../config";
import { Api } from "../interfaces";
import { MediaStorageUnavailable, MediaTooLarge, MediaUnsupportedType, MediaUpload } from "../interfaces/media";
import { CurrentUser } from "../interfaces/middlewares/auth";

export const MediaHandlers = HttpApiBuilder.group(
  Api,
  "media",
  Effect.fn(function* (handlers) {
    const config = yield* Config;

    const s3 = Option.map(config.s3, (s3Config) => ({
      client: new S3Client({
        endpoint: s3Config.endpoint,
        region: s3Config.region,
        credentials: {
          accessKeyId: Redacted.value(s3Config.accessKeyId),
          secretAccessKey: Redacted.value(s3Config.secretAccessKey),
        },
        forcePathStyle: true,
        requestChecksumCalculation: "WHEN_REQUIRED",
      }),
      bucket: s3Config.bucket,
    }));

    const cacheControl = `public, max-age=${config.media.cacheMaxAgeSeconds}, immutable`;

    return handlers.handle("requestUpload", ({ payload }) =>
      Effect.gen(function* () {
        if (Option.isNone(s3)) {
          return yield* new MediaStorageUnavailable();
        }
        const user = yield* CurrentUser;
        const ext = config.media.allowedTypes[payload.contentType];
        if (!ext) {
          return yield* new MediaUnsupportedType();
        }
        if (payload.size > config.media.maxUploadSizeBytes) {
          return yield* new MediaTooLarge();
        }
        const key = `${user.id}/${v7()}.${ext}`;
        const uploadUrl = yield* Effect.tryPromise(() =>
          getSignedUrl(
            s3.value.client,
            new PutObjectCommand({
              Bucket: s3.value.bucket,
              Key: key,
              ContentType: payload.contentType,
              ContentLength: payload.size,
              CacheControl: cacheControl,
            }),
            { expiresIn: config.media.presignExpirySeconds },
          ),
        );
        return new MediaUpload({
          uploadUrl,
          fileUrl: `${config.media.publicBaseUrl}/${key}`,
          headers: {
            "content-type": payload.contentType,
            "cache-control": cacheControl,
          },
        });
      }).pipe(Effect.catchTag("UnknownError", () => new HttpApiError.InternalServerError())),
    );
  }),
);
