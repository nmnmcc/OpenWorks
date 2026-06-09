"use client";

import { useAtom } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { useState } from "react";
import { createTodoAtom } from "@/atoms/todos";

export function AddTodo() {
	const [title, setTitle] = useState("");
	const [result, create] = useAtom(createTodoAtom);
	const isSubmitting = AsyncResult.isAsyncResult(result) && result.waiting;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (title.trim().length === 0) return;
		create(title);
		setTitle("");
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
		>
			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="What needs to be done?"
				disabled={isSubmitting}
				style={{
					flex: 1,
					padding: "0.5rem",
					border: "1px solid #ddd",
					borderRadius: "4px",
					fontSize: "1rem",
				}}
			/>
			<button
				type="submit"
				disabled={isSubmitting || title.trim().length === 0}
				style={{
					padding: "0.5rem 1rem",
					border: "none",
					borderRadius: "4px",
					background: "#0070f3",
					color: "white",
					cursor: "pointer",
					fontSize: "1rem",
				}}
			>
				{isSubmitting ? "Adding..." : "Add"}
			</button>
		</form>
	);
}
