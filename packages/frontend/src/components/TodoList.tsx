"use client";

import { useAtomSuspense } from "@effect/atom-react";
import { todosForSuspense } from "@/atoms/todos";
import { TodoItem } from "./TodoItem";

export function TodoList() {
	const result = useAtomSuspense(todosForSuspense);

	if (result.value.length === 0) {
		return (
			<p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>
				No todos yet
			</p>
		);
	}

	return (
		<ul style={{ listStyle: "none", padding: 0 }}>
			{result.value.map((todo) => (
				<TodoItem key={todo.id} todo={todo} />
			))}
		</ul>
	);
}
