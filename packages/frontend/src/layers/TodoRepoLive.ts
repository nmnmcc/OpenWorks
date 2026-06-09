import { Effect, Layer, Ref } from "effect";
import { CreateTodoInput, Todo, TodoNotFound } from "@/domain/Todo";
import { TodoRepo } from "@/domain/TodoRepo";

// In-memory implementation — swap for HttpClient-backed layer in production
export const TodoRepoLive = Layer.effect(
	TodoRepo,
	Effect.gen(function* () {
		const store = new Map<number, Todo>();
		const nextId = yield* Ref.make(1);

		// Seed data
		store.set(0, new Todo({ id: 0, title: "Learn Effect", completed: true }));

		const getAll = Effect.sync(() => Array.from(store.values()));

		const getById = Effect.fn("TodoRepo.getById")(function* (id: number) {
			const todo = store.get(id);
			if (todo === undefined) {
				return yield* new TodoNotFound({ id });
			}
			return todo;
		});

		const create = Effect.fn("TodoRepo.create")(function* (
			input: CreateTodoInput,
		) {
			const id = yield* Ref.getAndUpdate(nextId, (n) => n + 1);
			const todo = new Todo({ id, title: input.title, completed: false });
			store.set(id, todo);
			return todo;
		});

		const toggle = Effect.fn("TodoRepo.toggle")(function* (id: number) {
			const existing = store.get(id);
			if (existing === undefined) {
				return yield* new TodoNotFound({ id });
			}
			const updated = new Todo({ ...existing, completed: !existing.completed });
			store.set(id, updated);
			return updated;
		});

		const remove = Effect.fn("TodoRepo.remove")(function* (id: number) {
			if (!store.has(id)) {
				return yield* new TodoNotFound({ id });
			}
			store.delete(id);
		});

		return TodoRepo.of({ getAll, getById, create, toggle, remove });
	}),
);
