"use client";

import { Keys } from "@/atoms/keys";
import { addTagAtom, removeTagAtom, tagsAutocompleteQuery } from "@/atoms/works";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { PlusIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";

interface TagEditorProps {
  readonly workId: string;
  readonly tags: ReadonlyArray<{ readonly id: string; readonly name: string; readonly count: number }>;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +-----------------------------------------+
 * | [fantasy ×12 ×] [puzzle ×3 ×]          |  <- flex-wrap, each shrink-0
 * +-----------------------------------------+
 * | [_tag name input______] [+]             |  <- input flex-1 min-w-0, btn shrink-0
 * | suggestion1 | suggestion2 | ...         |  <- autocomplete hints
 * +-----------------------------------------+
 */
export function TagEditor({ workId, tags, className }: TagEditorProps) {
  const [t] = useT();
  const addTag = useAtomSet(addTagAtom, { mode: "promise" });
  const removeTag = useAtomSet(removeTagAtom, { mode: "promise" });
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const suggestionsResult = useAtomValue(tagsAutocompleteQuery(value.trim()));
  const suggestions = AsyncResult.isSuccess(suggestionsResult) ? suggestionsResult.value : [];

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await addTag({ params: { id: workId }, payload: { name: trimmed }, reactivityKeys: [Keys.workTags(workId), Keys.works] });
      setValue("");
    });
  };

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      await removeTag({ params: { id: workId, tagId }, reactivityKeys: [Keys.workTags(workId), Keys.works] });
    });
  };

  const existingNames = new Set(tags.map((tag) => tag.name.toLowerCase()));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge className="shrink-0 gap-1" key={tag.id} variant="secondary">
            {tag.name}
            <span className="text-muted-foreground">×{tag.count}</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleRemove(tag.id)} type="button">
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input className="min-w-0 flex-1" disabled={isPending} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd(value)} placeholder={t.library.tags} value={value} />
        <Button className="shrink-0" disabled={isPending || !value.trim()} onClick={() => handleAdd(value)} size="icon-sm" variant="outline">
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {value.trim().length > 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !existingNames.has(s.name.toLowerCase()))
            .map((s) => (
              <button className="text-muted-foreground hover:text-foreground rounded border px-2 py-0.5 text-xs transition-colors" key={s.name} onClick={() => handleAdd(s.name)} type="button">
                {s.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
