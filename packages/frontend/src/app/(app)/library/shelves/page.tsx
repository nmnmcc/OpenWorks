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

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Shelves                       [+ New]    |
 * | [My Shelves] [Public Shelves]            |
 * |  ^--- TabsList ---^                      |
 * | +--------------------------------------+ |
 * | | [bk] My Favorites    12 items       | |
 * | | ^shrink-0 ^flex-1 truncate ^shrink-0 | |
 * | +--------------------------------------+ |
 * | | [bk] Reading List     5 items       | |
 * | +--------------------------------------+ |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Shelves                            [+ New]         |
 * | [My Shelves] [Public Shelves]                      |
 * | [shelf cards -- same as mobile]                    |
 * +----------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Same as Tablet, wider margins                          |
 * +------------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Same as Desktop, wider margins                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-3xl mx-auto
 *
 * max-w-3xl 居中容器。Tabs 切换"我的书架"/"公开书架"。
 * 标题行 justify-between，h1 与 [+ New] 均为固定短标签。
 * 书架 Card 列表：图标(shrink-0) + 名称(flex-1 truncate) + 条目数(shrink-0)。
 * 新建书架通过 Dialog 弹窗。
 * 边界：0 个书架 → EmptyState。私有书架显示"Private"标签。
 *       ?ownerId=<他人 id>（nuqs）→ 隐藏 Tabs，直接列该用户的公开书架
 *       （后端按可见性过滤）；ownerId 为自己或缺省 → 正常 Tabs 模式。
 */
export default function ShelvesPage() {
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
