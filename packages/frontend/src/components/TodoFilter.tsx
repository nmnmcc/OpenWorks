"use client";

import { useAtom, useAtomValue } from "@effect/atom-react";
import { filterAtom, remainingCountAtom } from "@/atoms/todos";
import type { TodoFilter as FilterType } from "@/atoms/todos";

const filters: Array<{ readonly value: FilterType; readonly label: string }> = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "completed", label: "Completed" },
];

export function TodoFilter() {
	const [current, setFilter] = useAtom(filterAtom);
	const remaining = useAtomValue(remainingCountAtom);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "1rem",
				marginBottom: "1rem",
			}}
		>
			<span style={{ color: "#666" }}>{remaining} remaining</span>
			<div style={{ display: "flex", gap: "0.25rem" }}>
				{filters.map((f) => (
					<button
						key={f.value}
						onClick={() => setFilter(f.value)}
						style={{
							padding: "0.25rem 0.75rem",
							border: "1px solid #ddd",
							borderRadius: "4px",
							background: current === f.value ? "#0070f3" : "white",
							color: current === f.value ? "white" : "inherit",
							cursor: "pointer",
						}}
					>
						{f.label}
					</button>
				))}
			</div>
		</div>
	);
}
