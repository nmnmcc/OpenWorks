"use client";

import { addShelfItemAtom, createShelfAtom, removeShelfItemAtom, shelvesPageQuery } from "@/atoms/shelves";
import { Keys } from "@/atoms/keys";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { BookmarkPlusIcon, PlusIcon } from "lucide-react";
import { Suspense, useState, useTransition } from "react";

interface ShelfPickerMenuProps {
  readonly workId: string;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +----------------------------+
 * | [bookmark+] Add to Shelf   |  <- trigger button
 * +----------------------------+
 * | ☑ Favorites                |  <- my shelves with check state
 * | ☐ Wishlist                 |
 * |───────────────────────────|
 * | [+] New Shelf...           |  <- opens inline dialog
 * +----------------------------+
 */
function ShelfPickerMenuInner({ workId, className }: ShelfPickerMenuProps) {
  const [t] = useT();
  const myShelves = useAtomSuspense(shelvesPageQuery({ workId, offset: 0 }));
  const shelvesContaining = new Set(myShelves.value.map((s) => s.id));

  const allShelves = useAtomSuspense(shelvesPageQuery({ offset: 0 }));
  const addItem = useAtomSet(addShelfItemAtom, { mode: "promise" });
  const removeItem = useAtomSet(removeShelfItemAtom, { mode: "promise" });
  const createShelf = useAtomSet(createShelfAtom, { mode: "promise" });
  const [newShelfOpen, setNewShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (shelfId: string, isInShelf: boolean) => {
    startTransition(async () => {
      if (isInShelf) {
        await removeItem({ params: { id: shelfId }, query: { workId }, reactivityKeys: [Keys.shelves, Keys.shelfItems(shelfId)] });
      } else {
        await addItem({ params: { id: shelfId }, payload: { workId }, reactivityKeys: [Keys.shelves, Keys.shelfItems(shelfId)] });
      }
    });
  };

  const handleCreateShelf = () => {
    if (!newShelfName.trim()) return;
    startTransition(async () => {
      await createShelf({ payload: { name: newShelfName.trim() }, reactivityKeys: [Keys.shelves] });
      setNewShelfName("");
      setNewShelfOpen(false);
    });
  };

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button className={cn(className)} size="sm" variant="outline">
            <BookmarkPlusIcon className="size-4" />
            {t.library.shelf.addToShelf}
          </Button>
        </MenuTrigger>
        <MenuContent>
          {allShelves.value.map((shelf) => {
            const isInShelf = shelvesContaining.has(shelf.id);
            return (
              <MenuItem key={shelf.id} onClick={() => handleToggle(shelf.id, isInShelf)} value={shelf.id}>
                <Checkbox checked={isInShelf} className="pointer-events-none" />
                <span className="min-w-0 truncate">{shelf.name}</span>
              </MenuItem>
            );
          })}
          <MenuSeparator />
          <MenuItem onClick={() => setNewShelfOpen(true)} value="__new__">
            <PlusIcon className="size-4" />
            {t.library.newShelf}
          </MenuItem>
        </MenuContent>
      </Menu>

      <Dialog onOpenChange={(details) => setNewShelfOpen(details.open)} open={newShelfOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.library.newShelf}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
              onChange={(e) => setNewShelfName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateShelf()}
              placeholder={t.library.shelves}
              value={newShelfName}
            />
          </DialogBody>
          <DialogFooter>
            <Button disabled={isPending || !newShelfName.trim()} onClick={handleCreateShelf}>
              {t.common.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ShelfPickerMenu(props: ShelfPickerMenuProps) {
  return (
    <Suspense fallback={<Button className={cn(props.className)} disabled size="sm" variant="outline"><BookmarkPlusIcon className="size-4" /></Button>}>
      <ShelfPickerMenuInner {...props} />
    </Suspense>
  );
}
