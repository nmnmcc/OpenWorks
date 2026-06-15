"use client";

import { Keys } from "@/atoms/keys";
import { createShelfAtom, shelvesPageQuery } from "@/atoms/shelves";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { BookmarkIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState, useTransition } from "react";

function ShelfList({ ownerId }: { readonly ownerId?: string }) {
  const [t] = useT();

  return (
    <PagedList
      className="gap-3"
      emptyState={<EmptyState icon={<BookmarkIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => shelvesPageQuery({ ownerId, offset })}
      renderPage={(shelves) =>
        shelves.map((shelf) => (
          <Link href={`/library/shelves/${shelf.id}`} key={shelf.id}>
            <Card className="flex items-center gap-3 p-3 transition-shadow hover:shadow-md">
              <BookmarkIcon className="text-muted-foreground size-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{shelf.name}</span>
                <span className="text-muted-foreground text-xs">{t.library.shelf.itemCount(shelf.itemCount)}</span>
              </div>
              {!shelf.isPublic && (
                <span className="text-muted-foreground shrink-0 text-xs">{t.library.shelf.private}</span>
              )}
            </Card>
          </Link>
        ))
      }
    />
  );
}

export function ShelvesContent() {
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const [ownerId] = useQueryState("ownerId", parseAsString);
  const createShelf = useAtomSet(createShelfAtom, { mode: "promise" });
  const [newShelfOpen, setNewShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateShelf = () => {
    if (!newShelfName.trim()) return;
    startTransition(async () => {
      await createShelf({ payload: { name: newShelfName.trim() }, reactivityKeys: [Keys.shelves] });
      setNewShelfName("");
      setNewShelfOpen(false);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.library.shelves}</h1>
        <Button onClick={() => setNewShelfOpen(true)} size="sm">
          <PlusIcon className="size-4" />
          {t.library.newShelf}
        </Button>
      </div>

      {ownerId !== null && ownerId !== session?.user.id ? (
        <SectionBoundary>
          <ShelfList ownerId={ownerId} />
        </SectionBoundary>
      ) : (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">{t.library.myShelves}</TabsTrigger>
            <TabsTrigger value="public">{t.library.publicShelves}</TabsTrigger>
          </TabsList>
          <TabsContent value="mine">
            <SectionBoundary>
              <ShelfList ownerId={session?.user.id} />
            </SectionBoundary>
          </TabsContent>
          <TabsContent value="public">
            <SectionBoundary>
              <ShelfList />
            </SectionBoundary>
          </TabsContent>
        </Tabs>
      )}

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
    </div>
  );
}
