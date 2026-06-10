import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";
import { Api } from "@openworks/backend/api";

export class ApiClient extends AtomHttpApi.Service<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: Layer.merge(
    FetchHttpClient.layer,
    Layer.succeed(FetchHttpClient.RequestInit, {
      credentials: "include",
    }),
  ),
  baseUrl: "/api",
}) {}
