import { Context, Config as C, Layer, Redacted } from "effect";

export class Config extends Context.Service<Config>()(
	"@openworks/backend/services/config/Config",
	{
		make: C.all({
			server: C.all({
				port: C.port("PORT").pipe(C.withDefault(30000)),
				host: C.string("HOST").pipe(C.withDefault("0.0.0.0")),
			}),
			database: C.all({
				url: C.url("DATABASE_URL").pipe(
					C.map((u) => Redacted.make(u.toString())),
				),
			}),
		}),
	},
) {}

export namespace Config {
	export const layer = Layer.effect(Config, Config.make);
}
