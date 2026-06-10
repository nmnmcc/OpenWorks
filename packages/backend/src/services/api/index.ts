import { Layer } from "effect";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HttpRouter } from "effect/unstable/http";
import { Api as Interfaces } from "./interfaces";
import {
  PostsHandlers,
  HealthHandlers,
  GroupsHandlers,
  CommentsHandlers,
  VotesHandlers,
  FlairsHandlers,
  SavedHandlers,
  HiddenHandlers,
  ReportsHandlers,
  RulesHandlers,
  ModLogHandlers,
  MessagesHandlers,
  NotificationsHandlers,
  WikiHandlers,
  UsersHandlers,
  PollsHandlers,
} from "./implementations";
import { Auth } from "../auth/index";
import { Database, DatabasePool } from "../database/index";
import { Search } from "../search/index";
import { Authorization } from "../authorization/index";
import { AuthMiddlewareLive } from "./implementations/middlewares/auth";

export const Api = HttpApiBuilder.layer(Interfaces, {
  openapiPath: "/openapi.json",
}).pipe(
  Layer.provide([
    PostsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
      Layer.provide(Search.layer),
    ),
    GroupsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    CommentsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
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
      Layer.provide(AuthMiddlewareLive),
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
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    ModLogHandlers.pipe(
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
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Authorization.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    UsersHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    PollsHandlers.pipe(
      Layer.provide(AuthMiddlewareLive),
      Layer.provide(Auth.layer),
      Layer.provide(Database.layer),
      Layer.provide(DatabasePool.layer),
    ),
    HealthHandlers,
    HttpApiScalar.layer(Interfaces, { path: "/docs" }),
    HttpRouter.cors({
      allowedOrigins: ["http://localhost:3000"],
      credentials: true,
    }),
  ]),
);
