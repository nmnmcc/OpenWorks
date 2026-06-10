import { Schema } from "effect";

export const PortableTextSpan = Schema.Struct({
  _type: Schema.Literal("span"),
  _key: Schema.optional(Schema.String),
  text: Schema.String,
  marks: Schema.optional(Schema.Array(Schema.String)),
});

export const PortableTextMarkDef = Schema.Struct({
  _key: Schema.String,
  _type: Schema.String,
});

export const PortableTextBlock = Schema.Struct({
  _type: Schema.Literal("block"),
  _key: Schema.optional(Schema.String),
  style: Schema.optional(Schema.String),
  children: Schema.Array(PortableTextSpan),
  markDefs: Schema.optional(Schema.Array(PortableTextMarkDef)),
  listItem: Schema.optional(Schema.String),
  level: Schema.optional(Schema.Number),
});

export const PortableText = Schema.NonEmptyArray(PortableTextBlock);

export function portableTextToPlainText(content: ReadonlyArray<typeof PortableTextBlock.Type>): string {
  return content.map((block) => block.children.map((span) => span.text).join("")).join("\n");
}
