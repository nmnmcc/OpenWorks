import type { PortableTextContent } from "@/lib/portable-text";
import { cn } from "@/lib/utils";
import { PortableText } from "@portabletext/react";

interface PortableTextViewProps {
  readonly value: PortableTextContent;
  readonly className?: string;
}

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
