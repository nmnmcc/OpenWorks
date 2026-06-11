"use client";

import { libraryEntryQuery, removeLibraryAtom, upsertLibraryAtom } from "@/atoms/library";
import { Keys } from "@/atoms/keys";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { BookmarkIcon, CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Suspense, useTransition } from "react";

const STATUSES = ["want", "active", "completed", "on_hold", "dropped"] as const;

interface LibraryStatusControlProps {
  readonly workId: string;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * Not in library:
 * +---------------------+
 * | [+] Add to Library  |
 * +---------------------+
 *
 * In library (dropdown):
 * +---------------------+
 * | [✓] Completed  [v]  |
 * +---------------------+
 * | Want                 |
 * | In Progress          |
 * | ✓ Completed          |
 * | On Hold              |
 * | Dropped              |
 * |─────────────────────|
 * | Remove from Library  |
 * +---------------------+
 */
function LibraryStatusInner({ workId, className }: LibraryStatusControlProps) {
  const [t] = useT();
  const entry = useAtomSuspense(libraryEntryQuery(workId));
  const upsert = useAtomSet(upsertLibraryAtom, { mode: "promise" });
  const remove = useAtomSet(removeLibraryAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const currentStatus = entry.value.length > 0 ? entry.value[0]!.status : undefined;

  const handleStatusChange = (status: "want" | "active" | "completed" | "on_hold" | "dropped") => {
    startTransition(async () => {
      await upsert({ payload: { workId, status }, reactivityKeys: [Keys.library, Keys.work(workId)] });
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await remove({ query: { workId }, reactivityKeys: [Keys.library, Keys.work(workId)] });
    });
  };

  if (!currentStatus) {
    return (
      <Button className={cn(className)} disabled={isPending} onClick={() => handleStatusChange("want")} size="sm" variant="outline">
        <BookmarkIcon className="size-4" />
        {t.library.addToLibrary}
      </Button>
    );
  }

  const statusLabel = t.library.status[currentStatus as keyof typeof t.library.status] ?? currentStatus;

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button className={cn(className)} disabled={isPending} size="sm" variant="outline">
          <CheckIcon className="size-4" />
          {statusLabel}
          <ChevronDownIcon className="size-4" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        {STATUSES.map((status) => (
          <MenuItem key={status} onClick={() => handleStatusChange(status)} value={status}>
            {currentStatus === status && <CheckIcon className="size-4" />}
            {t.library.status[status]}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onClick={handleRemove} value="remove">
          <XIcon className="size-4" />
          {t.library.removeFromLibrary}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function LibraryStatusControl(props: LibraryStatusControlProps) {
  return (
    <Suspense fallback={<Button className={cn(props.className)} disabled size="sm" variant="outline"><BookmarkIcon className="size-4" /></Button>}>
      <LibraryStatusInner {...props} />
    </Suspense>
  );
}
