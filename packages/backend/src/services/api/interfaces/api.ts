import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiGroup,
	HttpApiSchema,
} from "effect/unstable/httpapi";
import { Todo, TodoNotFound } from "./domain";
import { AuthMiddleware } from "./middlewares/auth";

export class TodosGroup extends HttpApiGroup.make("todos")
	.add(
		HttpApiEndpoint.get("list", "/", {
			success: Schema.Array(Todo),
		}),
		HttpApiEndpoint.get("getById", "/:id", {
			params: { id: Schema.NumberFromString },
			success: Todo,
			error: TodoNotFound,
		}),
		HttpApiEndpoint.post("create", "/", {
			payload: Schema.Struct({
				title: Schema.String,
			}),
			success: Todo,
		}),
	)
	.middleware(AuthMiddleware)
	.prefix("/todos") {}

export class HealthGroup extends HttpApiGroup.make("health", {
	topLevel: true,
}).add(
	HttpApiEndpoint.get("health", "/health", {
		success: HttpApiSchema.NoContent,
	}),
) {}

export class Api extends HttpApi.make("api").add(TodosGroup).add(HealthGroup) {}
