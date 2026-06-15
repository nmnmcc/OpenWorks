import { Context, Schema, type Option } from "effect";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly image?: string | null;
  readonly displayName?: string | null;
  readonly bio?: string | null;
  readonly banner?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class CurrentSession extends Context.Service<CurrentSession, Session>()(
  "@openworks/backend/api/CurrentSession",
) {}

export class CurrentUser extends Context.Service<CurrentUser, User>()("@openworks/backend/api/CurrentUser") {}

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()("Unauthorized", {}, { httpApiStatus: 401 }) {}

export class AuthMiddleware extends HttpApiMiddleware.Service<
  AuthMiddleware,
  { provides: CurrentSession | CurrentUser }
>()("@openworks/backend/api/AuthMiddleware", {
  error: Unauthorized,
}) {}

/** 当前用户（可选）：匿名请求为 `Option.none()`，已登录为 `Option.some(user)`。 */
export class CurrentUserOption extends Context.Service<CurrentUserOption, Option.Option<User>>()(
  "@openworks/backend/api/CurrentUserOption",
) {}

/** 可选认证：从不拒绝请求，仅尽力解析会话并提供 `CurrentUserOption`。 */
export class OptionalAuthMiddleware extends HttpApiMiddleware.Service<
  OptionalAuthMiddleware,
  { provides: CurrentUserOption }
>()("@openworks/backend/api/OptionalAuthMiddleware") {}
