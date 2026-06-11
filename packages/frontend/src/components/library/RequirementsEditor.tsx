"use client";

import { setRequirementsAtom } from "@/atoms/works";
import { Keys } from "@/atoms/keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { useState, useTransition } from "react";

const PLATFORMS = ["windows", "macos", "linux"] as const;
const TIERS = ["minimum", "recommended"] as const;
const FIELDS = ["os", "cpu", "memory", "graphics", "storage", "notes"] as const;

interface RequirementEntry {
  platform: string;
  tier: string;
  os: string;
  cpu: string;
  memory: string;
  graphics: string;
  storage: string;
  notes: string;
}

interface RequirementsEditorProps {
  readonly workId: string;
  readonly requirements: ReadonlyArray<{
    readonly platform: string;
    readonly tier: string;
    readonly os: string | null;
    readonly cpu: string | null;
    readonly memory: string | null;
    readonly graphics: string | null;
    readonly storage: string | null;
    readonly notes: string | null;
  }>;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +------------------------------------------------+
 * | [Windows] [macOS] [Linux]        <- Tabs       |
 * +------------------------------------------------+
 * |  Minimum            Recommended                |
 * |  OS:      [_____]   OS:      [_____]           |
 * |  CPU:     [_____]   CPU:     [_____]           |
 * |  Memory:  [_____]   Memory:  [_____]           |
 * |  Graphics:[_____]   Graphics:[_____]           |
 * |  Storage: [_____]   Storage: [_____]           |
 * |  Notes:   [_____]   Notes:   [_____]           |
 * +------------------------------------------------+
 * | [Save]                                         |
 * +------------------------------------------------+
 *
 * Narrow: min/rec columns stack vertically (grid-cols-1 sm:grid-cols-2)
 */
export function RequirementsEditor({ workId, requirements: initial, className }: RequirementsEditorProps) {
  const [t] = useT();
  const setRequirements = useAtomSet(setRequirementsAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const initEntries = (): RequirementEntry[] => {
    const entries: RequirementEntry[] = [];
    for (const platform of PLATFORMS) {
      for (const tier of TIERS) {
        const existing = initial.find((r) => r.platform === platform && r.tier === tier);
        entries.push({
          platform,
          tier,
          os: existing?.os ?? "",
          cpu: existing?.cpu ?? "",
          memory: existing?.memory ?? "",
          graphics: existing?.graphics ?? "",
          storage: existing?.storage ?? "",
          notes: existing?.notes ?? "",
        });
      }
    }
    return entries;
  };

  const [entries, setEntries] = useState(initEntries);

  const handleUpdate = (platform: string, tier: string, field: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.platform === platform && e.tier === tier ? { ...e, [field]: value } : e)),
    );
  };

  const handleSave = () => {
    const payload = entries
      .filter((e) => FIELDS.some((f) => e[f].trim()))
      .map((e) => ({
        platform: e.platform,
        tier: e.tier,
        os: e.os || undefined,
        cpu: e.cpu || undefined,
        memory: e.memory || undefined,
        graphics: e.graphics || undefined,
        storage: e.storage || undefined,
        notes: e.notes || undefined,
      }));
    startTransition(async () => {
      await setRequirements({ params: { id: workId }, payload, reactivityKeys: [Keys.workRequirements(workId)] });
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Tabs defaultValue="windows">
        <TabsList>
          {PLATFORMS.map((p) => (
            <TabsTrigger key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</TabsTrigger>
          ))}
        </TabsList>
        {PLATFORMS.map((platform) => (
          <TabsContent key={platform} value={platform}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TIERS.map((tier) => {
                const entry = entries.find((e) => e.platform === platform && e.tier === tier)!;
                return (
                  <div className="flex flex-col gap-2" key={tier}>
                    <span className="text-sm font-medium">{t.library.requirement[tier]}</span>
                    {FIELDS.map((field) => (
                      <div className="flex items-center gap-2" key={field}>
                        <span className="text-muted-foreground w-20 shrink-0 text-xs">{t.library.requirement[field as keyof typeof t.library.requirement] ?? field}</span>
                        <Input
                          className="min-w-0 flex-1"
                          onChange={(e) => handleUpdate(platform, tier, field, e.target.value)}
                          value={entry[field as keyof RequirementEntry] ?? ""}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <Button className="self-start" disabled={isPending} onClick={handleSave} size="sm">
        {t.common.save}
      </Button>
    </div>
  );
}
