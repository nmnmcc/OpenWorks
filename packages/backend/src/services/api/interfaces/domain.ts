import { Schema } from "effect";

export class Todo extends Schema.Class<Todo>("Todo")({
	id: Schema.Number,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
	"TodoNotFound",
	{},
	{ httpApiStatus: 404 },
) {}
