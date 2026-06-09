"use client";

import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { Cause } from "effect";
import type { Atom } from "effect/unstable/reactivity/Atom";

// Non-Suspense pattern: manually match on AsyncResult states
export function AsyncResultView<A, E>({
	atom,
	onSuccess,
	onLoading = () => <p>Loading...</p>,
	onError = (e) => <p style={{ color: "red" }}>Error: {String(e)}</p>,
}: {
	readonly atom: Atom<AsyncResult.AsyncResult<A, E>>;
	readonly onSuccess: (value: A, waiting: boolean) => React.ReactNode;
	readonly onLoading?: () => React.ReactNode;
	readonly onError?: (error: unknown) => React.ReactNode;
}) {
	const result = useAtomValue(atom);

	return AsyncResult.match(result, {
		onInitial: () => onLoading(),
		onSuccess: (r) => onSuccess(r.value, r.waiting),
		onFailure: (r) => onError(Cause.squash(r.cause)),
	});
}
