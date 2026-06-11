import { PortableText, portableTextToPlainText } from "@openworks/backend/portable-text";
import type { PortableTextContent } from "@openworks/backend/portable-text";
import { Schema } from "effect";

export * from "@openworks/backend/portable-text";

/**
 * 将编辑器产出的块数组解析为 API 所需的 Portable Text 内容。
 * 复用后端同一 schema 做校验（端到端同源）；空内容（无任何非空白文本）
 * 返回 undefined，由调用方决定是省略字段还是阻止提交。
 */
export function toPortableTextContent(blocks: ReadonlyArray<unknown> | undefined): PortableTextContent | undefined {
  if (blocks === undefined || blocks.length === 0) {
    return undefined;
  }
  const content = Schema.decodeUnknownSync(PortableText)(blocks);
  return portableTextToPlainText(content).trim().length === 0 ? undefined : content;
}
