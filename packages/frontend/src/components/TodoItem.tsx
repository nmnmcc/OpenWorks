"use client";

import { useAtomSet } from "@effect/atom-react";
import type { Todo } from "@/domain/Todo";
import { toggleTodoAtom, removeTodoAtom } from "@/atoms/todos";

export function TodoItem({ todo }: { readonly todo: Todo }) {
	const toggle = useAtomSet(toggleTodoAtom);
	const remove = useAtomSet(removeTodoAtom);

	return (
		<li
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.75rem",
				padding: "0.75rem 0",
				borderBottom: "1px solid #eee",
			}}
		>
			<input
				type="checkbox"
				checked={todo.completed}
				onChange={() => toggle(todo.id)}
			/>
			<span
				style={{
					flex: 1,
					textDecoration: todo.completed ? "line-through" : "none",
					color: todo.completed ? "#aaa" : "inherit",
				}}
			>
				{todo.title}
			</span>
			<button
				onClick={() => remove(todo.id)}
				style={{
					background: "none",
					border: "1px solid #ddd",
					borderRadius: "4px",
					padding: "0.25rem 0.5rem",
					cursor: "pointer",
				}}
			>
				Delete
			</button>
		</li>
	);
}
