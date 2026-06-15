import type { PortableTextContent } from "@/lib/portable-text";
import { cn } from "@/lib/utils";
import { PortableText } from "@portabletext/react";

interface PortableTextViewProps {
  readonly value: PortableTextContent;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +----------------------------------------------+
 * | Heading (h1/h2/h3 — font-semibold, sized)   |
 * | Paragraph text with inline **bold**, *em*,   |
 * | `code`, ~~strike~~, __underline__, [link]()  |
 * |                                              |
 * | > blockquote (border-s-2, ps-3)              |
 * |                                              |
 * | - bullet list (ps-5)                         |
 * | 1. numbered list (ps-5)                      |
 * +----------------------------------------------+
 *   space-y-2 text-sm leading-relaxed wrap-anywhere
 *
 * All breakpoints: block-flow text content, width determined
 * by parent container. No breakpoint-specific behavior — text
 * reflows naturally. Long words break via wrap-anywhere.
 */
export function PortableTextView({ value, className }: PortableTextViewProps) {
  return (
    <div
      className={cn(
        "space-y-2 text-sm leading-relaxed wrap-anywhere",
        "[&_a]:text-primary [&_a]:underline",
        "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_blockquote]:text-muted-foreground [&_blockquote]:border-s-2 [&_blockquote]:ps-3",
        "[&_ol]:list-decimal [&_ol]:ps-5 [&_ul]:list-disc [&_ul]:ps-5",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]",
        className,
      )}
    >
      <PortableText value={[...value]} />
    </div>
  );
}
