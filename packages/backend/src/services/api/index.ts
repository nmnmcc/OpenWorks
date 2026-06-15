import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { Auth } from "../auth";
import { Authorization } from "../authorization";
import { Config } from "../config";
import { Database, DatabasePool } from "../database";
import { Search } from "../search";
import { CommentsHandlers } from "./implementations/comments";
import { CreatorsHandlers } from "./implementations/creators";
import { FlairsHandlers } from "./implementations/flairs";
import { HealthHandlers } from "./implementations/health";
import { HiddenHandlers } from "./implementations/hidden";
import { LibraryHandlers } from "./implementations/library";
import { MediaHandlers } from "./implementations/media";
import { MessagesHandlers } from "./implementations/messages";
import { AuthMiddlewareLive, OptionalAuthMiddlewareLive } from "./implementations/middlewares/auth";
import { ModerationLogsHandlers } from "./implementations/moderation-log";
import { NotificationsHandlers } from "./implementations/notifications";
import { PollsHandlers } from "./implementations/polls";
import { PostsHandlers } from "./implementations/posts";
import { ReportsHandlers } from "./implementations/reports";
import { RulesHandlers } from "./implementations/rules";
import { SavedHandlers } from "./implementations/saved";
import { ShelvesHandlers } from "./implementations/shelves";
import { SpacesHandlers } from "./implementations/spaces";
import { UsersHandlers } from "./implementations/users";
import { VotesHandlers } from "./implementations/votes";
import { WikiHandlers } from "./implementations/wiki";
import { WorksHandlers } from "./implementations/works";
import { Api as Interfaces } from "./interfaces";
import { AuthRoutes } from "./routes/auth";

export const Api = HttpApiBuilder.layer(Interfaces, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide([
    PostsHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    SpacesHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    CommentsHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    VotesHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    FlairsHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    SavedHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    HiddenHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    ReportsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    RulesHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    ModerationLogsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    MessagesHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    NotificationsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    WikiHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    UsersHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    PollsHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    WorksHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Search.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    CreatorsHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    LibraryHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    ShelvesHandlers.pipe(
      Layer.provide([AuthMiddlewareLive, OptionalAuthMiddlewareLive]),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    MediaHandlers.pipe(Layer.provide(AuthMiddlewareLive), Layer.provide(Auth.layer), Layer.provide(DatabasePool.layer)),
    AuthRoutes.pipe(Layer.provide(Auth.layer), Layer.provide(DatabasePool.layer)),
    HealthHandlers,
    HttpApiScalar.layer(Interfaces, { path: "/api/docs" }),
    Layer.unwrap(
      Effect.gen(function* () {
        const config = yield* Config;
        return HttpRouter.cors({
          allowedOrigins: config.server.corsOrigins,
          credentials: true,
        });
      }),
    ),
  ]),
);
