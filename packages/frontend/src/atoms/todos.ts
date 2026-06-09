import { Effect } from "effect";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { Todo } from "@/domain/Todo";
import { CreateTodoInput } from "@/domain/Todo";
import { TodoRepo } from "@/domain/TodoRepo";
import { appRuntime } from "./runtime";

// ---------------------------------------------------------------------------
// Read: all todos (async, backed by TodoRepo service)
// ---------------------------------------------------------------------------

export const todosAtom = appRuntime
	.atom(TodoRepo.use((repo) => repo.getAll))
	.pipe(Atom.withReactivity(["todos"]));

// ---------------------------------------------------------------------------
// Derived: filtered view
// ---------------------------------------------------------------------------

export type TodoFilter = "all" | "active" | "completed";

export const filterAtom = Atom.make<TodoFilter>("all");

export const filteredTodosAtom = Atom.make((get) => {
	const result = get(todosAtom);
	const filter = get(filterAtom);

	return AsyncResult.map(result, (todos) => {
		switch (filter) {
			case "active":
				return todos.filter((t) => !t.completed);
			case "completed":
				return todos.filter((t) => t.completed);
			default:
				return todos;
		}
	});
});

// ---------------------------------------------------------------------------
// Derived: remaining count
// ---------------------------------------------------------------------------

export const remainingCountAtom = Atom.make((get) => {
	const result = get(todosAtom);
	if (!AsyncResult.isSuccess(result)) return 0;
	return result.value.filter((t) => !t.completed).length;
});

// ---------------------------------------------------------------------------
// Mutation: create a todo (Atom.fn — triggered imperatively from UI)
// ---------------------------------------------------------------------------

export const createTodoAtom = appRuntime.fn(
	(title: string) =>
		Effect.gen(function* () {
			const input = new CreateTodoInput({ title: title.trim() });
			const repo = yield* TodoRepo;
			return yield* repo.create(input);
		}),
	{ reactivityKeys: ["todos"] },
);

// ---------------------------------------------------------------------------
// Mutation: toggle completion
// ---------------------------------------------------------------------------

export const toggleTodoAtom = appRuntime.fn(
	(id: number) => TodoRepo.use((repo) => repo.toggle(id)),
	{ reactivityKeys: ["todos"] },
);

// ---------------------------------------------------------------------------
// Mutation: delete a todo
// ---------------------------------------------------------------------------

export const removeTodoAtom = appRuntime.fn(
	(id: number) => TodoRepo.use((repo) => repo.remove(id)),
	{ reactivityKeys: ["todos"] },
);

// ---------------------------------------------------------------------------
// Derived helper for Suspense consumers
// ---------------------------------------------------------------------------

export const todosForSuspense = filteredTodosAtom as Atom.Atom<
	AsyncResult.AsyncResult<Array<Todo>>
>;
