import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

export const make = (pool: Pool) =>
	betterAuth({
		database: drizzleAdapter(drizzle({ client: pool }), {
			provider: "pg",
			camelCase: false,
			usePlural: true,
			transaction: true,
		}),
		emailAndPassword: {
			enabled: true,
		},
	});
