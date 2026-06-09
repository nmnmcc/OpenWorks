import { Context, Effect } from "effect";
import type { CreateTodoInput, Todo, TodoNotFound } from "./Todo";

export class TodoRepo extends Context.Service<
	TodoRepo,
	{
		readonly getAll: Effect.Effect<Array<Todo>>;
		getById(id: number): Effect.Effect<Todo, TodoNotFound>;
		create(input: CreateTodoInput): Effect.Effect<Todo>;
		toggle(id: number): Effect.Effect<Todo, TodoNotFound>;
		remove(id: number): Effect.Effect<void, TodoNotFound>;
	}
>()("openworks/TodoRepo") {}
