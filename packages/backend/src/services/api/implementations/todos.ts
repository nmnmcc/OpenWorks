import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Todo, TodoNotFound } from "../interfaces/domain";
import { Api } from "../interfaces/api";

let nextId = 1;
const todos: Array<Todo> = [];

export const TodosHandlers = HttpApiBuilder.group(
	Api,
	"todos",
	Effect.fn(function* (handlers) {
		return handlers
			.handle("list", () => Effect.succeed(todos))
			.handle("getById", ({ params }) => {
				const todo = todos.find((t) => t.id === params.id);
				return todo ? Effect.succeed(todo) : Effect.fail(new TodoNotFound());
			})
			.handle("create", ({ payload }) => {
				const todo = new Todo({
					id: nextId++,
					title: payload.title,
					completed: false,
				});
				todos.push(todo);
				return Effect.succeed(todo);
			});
	}),
);
