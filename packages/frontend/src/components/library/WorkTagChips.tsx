"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkTagChipsProps {
  readonly tags: ReadonlyArray<{ readonly id: string; readonly name: string; readonly count: number }>;
  readonly onRemove?: (tagId: string) => void;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +-------------------------------------------+
 * | [fantasy ×12] [puzzle ×3] [sci-fi ×1]     |
 * +-------------------------------------------+
 *  flex-wrap, each tag shrink-0
 */
export function WorkTagChips({ tags, onRemove, className }: WorkTagChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge className="shrink-0 gap-1" key={tag.id} variant="secondary">
          {tag.name}
          <span className="text-muted-foreground">×{tag.count}</span>
          {onRemove && (
            <button className="text-muted-foreground hover:text-foreground ml-0.5 transition-colors" onClick={() => onRemove(tag.id)} type="button">
              ×
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}
