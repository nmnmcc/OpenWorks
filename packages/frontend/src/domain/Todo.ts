import { Schema } from "effect";

export class Todo extends Schema.Class<Todo>("Todo")({
	id: Schema.Number,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

export class CreateTodoInput extends Schema.Class<CreateTodoInput>(
	"CreateTodoInput",
)({
	title: Schema.NonEmptyString,
}) {}

export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
	"TodoNotFound",
	{
		id: Schema.Number,
	},
) {}
