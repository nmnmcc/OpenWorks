"use client";

import { createChapterAtom, deleteChapterAtom } from "@/atoms/works";
import { Keys } from "@/atoms/keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";

interface ChapterEntry {
  readonly id: string;
  readonly title: string;
  readonly position: number;
}

interface ChapterListEditorProps {
  readonly workId: string;
  readonly chapters: ReadonlyArray<ChapterEntry>;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +-------------------------------------------+
 * | [≡] 1. Prelude to the Stormlight..  [🗑]  |  <- each row
 * | [≡] 2. Prologue: To Kill...........  [🗑]  |     title flex-1 min-w-0 truncate
 * | [≡] 3. Chapter 1: Stormblessed....  [🗑]  |     grip+delete shrink-0
 * +-------------------------------------------+
 * | [New chapter title______] [+ Add]         |
 * +-------------------------------------------+
 */
export function ChapterListEditor({ workId, chapters, className }: ChapterListEditorProps) {
  const [t] = useT();
  const createChapter = useAtomSet(createChapterAtom, { mode: "promise" });
  const deleteChapter = useAtomSet(deleteChapterAtom, { mode: "promise" });
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await createChapter({ params: { id: workId }, payload: { title: newTitle.trim(), position: chapters.length }, reactivityKeys: [Keys.workChapters(workId)] });
      setNewTitle("");
    });
  };

  const handleDelete = (chapterId: string) => {
    startTransition(async () => {
      await deleteChapter({ params: { chapterId }, reactivityKeys: [Keys.workChapters(workId)] });
    });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {chapters.map((chapter, index) => (
        <div className="flex items-center gap-2" key={chapter.id}>
          <GripVerticalIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground shrink-0 text-sm">{index + 1}.</span>
          <span className="min-w-0 flex-1 truncate text-sm">{chapter.title}</span>
          <Button className="shrink-0" disabled={isPending} onClick={() => handleDelete(chapter.id)} size="icon-sm" variant="ghost">
            <TrashIcon className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          className="min-w-0 flex-1"
          disabled={isPending}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t.library.chapter.chapter}
          value={newTitle}
        />
        <Button className="shrink-0" disabled={isPending || !newTitle.trim()} onClick={handleAdd} size="sm" variant="outline">
          <PlusIcon className="size-4" />
          {t.common.create}
        </Button>
      </div>
    </div>
  );
}
