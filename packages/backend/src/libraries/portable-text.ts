import { Schema } from "effect";

export const PortableTextSpan = Schema.Struct({
  _type: Schema.Literal("span"),
  _key: Schema.String,
  text: Schema.String,
  marks: Schema.optional(Schema.Array(Schema.String)),
});

/**
 * 规范要求 markDef 仅固定 `_key`/`_type` 两个字段，其余属性（如 link 的
 * `href`）由各 annotation 类型自由定义，校验时必须原样保留，不得剥除。
 */
export const PortableTextMarkDef = Schema.StructWithRest(
  Schema.Struct({
    _key: Schema.String,
    _type: Schema.String,
  }),
  [Schema.Record(Schema.String, Schema.Unknown)],
);

export const PortableTextBlock = Schema.Struct({
  _type: Schema.Literal("block"),
  _key: Schema.String,
  style: Schema.optional(Schema.String),
  children: Schema.Array(PortableTextSpan),
  markDefs: Schema.optional(Schema.Array(PortableTextMarkDef)),
  listItem: Schema.optional(Schema.String),
  level: Schema.optional(Schema.Number),
});

export const PortableText = Schema.NonEmptyArray(PortableTextBlock);

export type PortableTextContent = typeof PortableText.Type;

export function portableTextToPlainText(content: ReadonlyArray<typeof PortableTextBlock.Type>): string {
  return content.map((block) => block.children.map((span) => span.text).join("")).join("\n");
}
