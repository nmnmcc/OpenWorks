import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { AuthMiddleware } from "./middlewares/auth";

export class GroupRuleEntry extends Schema.Class<GroupRuleEntry>("GroupRuleEntry")({
  id: Schema.String,
  groupId: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  position: Schema.Number,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
}) {}

export class RuleNotFound extends Schema.TaggedErrorClass<RuleNotFound>()("RuleNotFound", {}, { httpApiStatus: 404 }) {}

export class RuleForbidden extends Schema.TaggedErrorClass<RuleForbidden>()(
  "RuleForbidden",
  {},
  { httpApiStatus: 403 },
) {}

export class RulesGroup extends HttpApiGroup.make("rules")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        groupId: Schema.String,
      },
      success: Schema.Array(GroupRuleEntry),
      error: [RuleForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        groupId: Schema.String,
        title: Schema.String,
        description: Schema.optional(Schema.String),
        position: Schema.optional(Schema.Number),
      }),
      success: GroupRuleEntry,
      error: [RuleForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: Schema.String },
      payload: Schema.Struct({
        title: Schema.optional(Schema.String),
        description: Schema.optional(Schema.NullOr(Schema.String)),
        position: Schema.optional(Schema.Number),
      }),
      success: GroupRuleEntry,
      error: [RuleNotFound, RuleForbidden, HttpApiError.InternalServerError],
    }),
    HttpApiEndpoint.delete("delete", "/:id", {
      params: { id: Schema.String },
      success: HttpApiSchema.NoContent,
      error: [RuleNotFound, RuleForbidden, HttpApiError.InternalServerError],
    }),
  )
  .middleware(AuthMiddleware)
  .prefix("/rules") {}
