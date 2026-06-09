"use client";

import { RegistryProvider } from "@effect/atom-react";
import type { ReactNode } from "react";

export function Providers({ children }: { readonly children: ReactNode }) {
	return <RegistryProvider>{children}</RegistryProvider>;
}
