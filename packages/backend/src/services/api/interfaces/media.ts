import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "effect/unstable/httpapi";

import { AuthMiddleware } from "./middlewares/auth";

export class MediaUpload extends Schema.Class<MediaUpload>("MediaUpload")({
  uploadUrl: Schema.String,
  fileUrl: Schema.String,
  headers: Schema.Struct({
    "content-type": Schema.String,
    "cache-control": Schema.String,
  }),
}) {}

export class MediaUnsupportedType extends Schema.TaggedErrorClass<MediaUnsupportedType>()(
  "MediaUnsupportedType",
  {},
  { httpApiStatus: 415 },
) {}

export class MediaTooLarge extends Schema.TaggedErrorClass<MediaTooLarge>()(
  "MediaTooLarge",
  {},
  { httpApiStatus: 413 },
) {}

export class MediaStorageUnavailable extends Schema.TaggedErrorClass<MediaStorageUnavailable>()(
  "MediaStorageUnavailable",
  {},
  { httpApiStatus: 503 },
) {}

export class MediaGroup extends HttpApiGroup.make("media")
  .add(
    HttpApiEndpoint.post("requestUpload", "/uploads", {
      payload: Schema.Struct({
        contentType: Schema.String,
        size: Schema.Int,
      }),
      success: MediaUpload,
      error: [MediaUnsupportedType, MediaTooLarge, MediaStorageUnavailable, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/media") {}
