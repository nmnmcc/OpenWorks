"use client";

import { setCreditsAtom } from "@/atoms/works";
import { Keys } from "@/atoms/keys";
import { CreatorPicker } from "@/components/shared/CreatorPicker";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { GripVerticalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";

interface CreditEntry {
  readonly creatorId: string;
  readonly creatorName: string;
  readonly role: string;
  readonly characterName: string | null;
}

interface CreditsEditorProps {
  readonly workId: string;
  readonly workType: string;
  readonly credits: ReadonlyArray<CreditEntry>;
  readonly className?: string;
}

const ROLES_BY_TYPE: Record<string, ReadonlyArray<string>> = {
  book: ["author", "illustrator", "translator", "editor", "publisher"],
  movie: ["director", "writer", "actor", "composer", "producer", "studio"],
  tv: ["director", "writer", "actor", "composer", "producer", "studio"],
  game: ["developer", "publisher", "designer", "writer", "composer"],
};

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +--------------------------------------------------+
 * | [≡] [CreatorPicker___] [role v] [char____] [🗑]  |  <- each row
 * | [≡] [CreatorPicker___] [role v] [char____] [🗑]  |     flex-wrap on narrow
 * +--------------------------------------------------+
 * | [+ Add credit]                                   |
 * +--------------------------------------------------+
 * | [Save credits]                                    |
 * +--------------------------------------------------+
 *
 * Narrow: CreatorPicker flex-1 min-w-40, role select shrink-0 w-28,
 *         character input flex-1 min-w-24, buttons shrink-0.
 *         Row flex-wraps so picker+role land on first line,
 *         character+delete on second if needed.
 */
export function CreditsEditor({ workId, workType, credits: initialCredits, className }: CreditsEditorProps) {
  const [t] = useT();
  const setCredits = useAtomSet(setCreditsAtom, { mode: "promise" });
  const [entries, setEntries] = useState<CreditEntry[]>([...initialCredits]);
  const [isPending, startTransition] = useTransition();

  const roles = ROLES_BY_TYPE[workType] ?? ROLES_BY_TYPE["book"]!;

  const handleAdd = () => {
    setEntries((prev) => [...prev, { creatorId: "", creatorName: "", role: roles[0]!, characterName: null }]);
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, patch: Partial<CreditEntry>) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const handleSave = () => {
    const payload = entries
      .filter((e) => e.creatorId)
      .map((e, i) => ({
        creatorId: e.creatorId,
        role: e.role,
        characterName: e.characterName ?? undefined,
        position: i,
      }));
    startTransition(async () => {
      await setCredits({ params: { id: workId }, payload, reactivityKeys: [Keys.workCredits(workId)] });
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {entries.map((entry, index) => (
        <div className="flex flex-wrap items-start gap-2" key={index}>
          <GripVerticalIcon className="text-muted-foreground mt-2.5 size-4 shrink-0" />
          <div className="min-w-40 flex-1">
            <CreatorPicker
              onValueChange={(id) => handleUpdate(index, { creatorId: id ?? "" })}
              value={entry.creatorId || undefined}
            />
          </div>
          <SimpleSelect
            className="w-28 shrink-0"
            items={roles.map((role) => ({ value: role, label: t.library.role[role as keyof typeof t.library.role] ?? role }))}
            onChange={(val) => handleUpdate(index, { role: val })}
            value={entry.role}
          />
          <Input
            className="min-w-24 flex-1"
            onChange={(e) => handleUpdate(index, { characterName: e.target.value || null })}
            placeholder={t.library.role.actor}
            value={entry.characterName ?? ""}
          />
          <Button className="shrink-0" onClick={() => handleRemove(index)} size="icon-sm" variant="ghost">
            <TrashIcon className="size-4" />
          </Button>
        </div>
      ))}
      <Button className="self-start" onClick={handleAdd} size="sm" variant="outline">
        <PlusIcon className="size-4" />
        {t.library.credits}
      </Button>
      <Button className="self-start" disabled={isPending} onClick={handleSave} size="sm">
        {t.common.save}
      </Button>
    </div>
  );
}
