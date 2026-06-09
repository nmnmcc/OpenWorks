"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AddTodo } from "@/components/AddTodo";
import { TodoFilter } from "@/components/TodoFilter";
import { TodoList } from "@/components/TodoList";

// Pattern: Suspense + ErrorBoundary wrapping async Atom consumers.
// TodoList uses useAtomSuspense → Initial throws Promise → Suspense catches.
// Failure throws Error → ErrorBoundary catches.
export default function TodosPage() {
	return (
		<main style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
			<h1>Todos (Suspense)</h1>
			<AddTodo />
			<TodoFilter />
			<ErrorBoundary
				fallbackRender={({ error, resetErrorBoundary }) => (
					<div
						style={{
							color: "red",
							padding: "1rem",
							border: "1px solid red",
							borderRadius: "4px",
						}}
					>
						<p>Something went wrong: {String(error)}</p>
						<button onClick={resetErrorBoundary}>Retry</button>
					</div>
				)}
			>
				<Suspense
					fallback={
						<p style={{ textAlign: "center", padding: "2rem" }}>
							Loading todos...
						</p>
					}
				>
					<TodoList />
				</Suspense>
			</ErrorBoundary>
		</main>
	);
}
