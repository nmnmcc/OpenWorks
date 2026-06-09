"use client";

import { AddTodo } from "@/components/AddTodo";
import { TodoFilter } from "@/components/TodoFilter";
import { AsyncResultView } from "@/components/AsyncResultView";
import { TodoItem } from "@/components/TodoItem";
import { todosForSuspense } from "@/atoms/todos";
import type { Todo } from "@/domain/Todo";

// Pattern: manually matching AsyncResult without Suspense.
// Useful when you need fine-grained control over loading/error states inline.
export default function TodosManualPage() {
	return (
		<main style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
			<h1>Todos (Manual AsyncResult)</h1>
			<AddTodo />
			<TodoFilter />
			<AsyncResultView
				atom={todosForSuspense}
				onSuccess={(todos: Array<Todo>, waiting: boolean) => (
					<div
						style={{ opacity: waiting ? 0.6 : 1, transition: "opacity 0.2s" }}
					>
						{todos.length === 0 ? (
							<p
								style={{ color: "#888", textAlign: "center", padding: "2rem" }}
							>
								No todos yet
							</p>
						) : (
							<ul style={{ listStyle: "none", padding: 0 }}>
								{todos.map((todo) => (
									<TodoItem key={todo.id} todo={todo} />
								))}
							</ul>
						)}
					</div>
				)}
			/>
		</main>
	);
}
