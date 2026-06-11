"use client";

import { importPreviewQuery } from "@/atoms/works";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSuspense } from "@effect/atom-react";
import { DownloadIcon, SearchIcon } from "lucide-react";
import { Suspense, useState } from "react";

const SOURCES = ["isbn", "tmdb", "steam"] as const;

interface ImportPanelProps {
  readonly onImport: (data: unknown) => void;
  readonly className?: string;
}

function ImportPreview({ source, externalId, onImport }: { readonly source: string; readonly externalId: string; readonly onImport: (data: unknown) => void }) {
  const [t] = useT();
  const result = useAtomSuspense(importPreviewQuery(source, externalId));

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-sm font-medium">{result.value.title ?? t.library.import.preview}</span>
      {result.value.existingWorkId && (
        <span className="text-muted-foreground text-xs">
          Already exists — <a className="underline" href={`/library/works/${result.value.existingWorkId}`}>view</a>
        </span>
      )}
      <Button disabled={!!result.value.existingWorkId} onClick={() => onImport(result.value)} size="sm">
        <DownloadIcon className="size-4" />
        {t.library.import.preview}
      </Button>
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +------------------------------------------+
 * | Import from external source              |
 * | [Source v] [External ID_________] [🔍]   |
 * |  ^shrink-0  ^flex-1 min-w-0      ^shrink-0
 * +------------------------------------------+
 * | Preview card (if searched):              |
 * | Title... [Import]                        |
 * +------------------------------------------+
 *
 * Narrow: source select and button shrink-0, ID input flex-1.
 */
export function ImportPanel({ onImport, className }: ImportPanelProps) {
  const [t] = useT();
  const [source, setSource] = useState<string>("isbn");
  const [externalId, setExternalId] = useState("");
  const [searched, setSearched] = useState<{ source: string; externalId: string } | undefined>(undefined);

  const handleSearch = () => {
    if (!externalId.trim()) return;
    setSearched({ source, externalId: externalId.trim() });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="text-sm font-medium">{t.library.import.title}</span>
      <div className="flex items-center gap-2">
        <SimpleSelect
          className="w-24 shrink-0"
          items={SOURCES.map((s) => ({ value: s, label: t.library.import[s] }))}
          onChange={setSource}
          value={source}
        />
        <Input
          className="min-w-0 flex-1"
          onChange={(e) => setExternalId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t.library.import.externalId}
          value={externalId}
        />
        <Button className="shrink-0" disabled={!externalId.trim()} onClick={handleSearch} size="icon-sm" variant="outline">
          <SearchIcon className="size-4" />
        </Button>
      </div>
      {searched && (
        <Suspense fallback={<div className="text-muted-foreground text-sm">{t.common.loading}</div>}>
          <ImportPreview externalId={searched.externalId} onImport={onImport} source={searched.source} />
        </Suspense>
      )}
    </div>
  );
}
