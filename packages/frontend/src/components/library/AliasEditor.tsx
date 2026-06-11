"use client";

import { addAliasAtom, removeAliasAtom } from "@/atoms/works";
import { Keys } from "@/atoms/keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { PlusIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";

const ALIAS_KINDS = ["common", "abbreviation", "transliteration", "alternate_title", "legacy_title", "misspelling", "other"] as const;

interface AliasEditorProps {
  readonly workId: string;
  readonly aliases: ReadonlyArray<{ readonly id: string; readonly value: string; readonly kind: string }>;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +-----------------------------------------+
 * | [TWoK] abbreviation × | [S1] common ×  |  <- flex-wrap, each shrink-0
 * +-----------------------------------------+
 * | [_value input____] [kind v] [+]         |  <- add row: input flex-1, select shrink-0
 * +-----------------------------------------+
 */
export function AliasEditor({ workId, aliases, className }: AliasEditorProps) {
  const [t] = useT();
  const addAlias = useAtomSet(addAliasAtom, { mode: "promise" });
  const removeAlias = useAtomSet(removeAliasAtom, { mode: "promise" });
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<string>("common");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!value.trim()) return;
    startTransition(async () => {
      await addAlias({ params: { id: workId }, payload: { value: value.trim(), kind }, reactivityKeys: [Keys.workAliases(workId), Keys.works] });
      setValue("");
    });
  };

  const handleRemove = (aliasId: string) => {
    startTransition(async () => {
      await removeAlias({ params: { id: workId, aliasId }, reactivityKeys: [Keys.workAliases(workId), Keys.works] });
    });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {aliases.map((alias) => (
          <Badge className="shrink-0 gap-1" key={alias.id} variant="secondary">
            {alias.value}
            <span className="text-muted-foreground text-xs">{t.library.aliasKind[alias.kind as keyof typeof t.library.aliasKind] ?? alias.kind}</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleRemove(alias.id)} type="button">
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input className="min-w-0 flex-1" disabled={isPending} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder={t.library.aliases} value={value} />
        <SimpleSelect
          className="w-36 shrink-0"
          items={ALIAS_KINDS.map((k) => ({ value: k, label: t.library.aliasKind[k] }))}
          onChange={setKind}
          value={kind}
        />
        <Button className="shrink-0" disabled={isPending || !value.trim()} onClick={handleAdd} size="icon-sm" variant="outline">
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
