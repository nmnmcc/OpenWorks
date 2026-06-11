"use client";

import { Keys } from "@/atoms/keys";
import { deleteShelfAtom, removeShelfItemAtom, shelfItemsQuery, shelfQuery } from "@/atoms/shelves";
import { SectionBoundary } from "@/components/SectionBoundary";
import { WorkCard } from "@/components/library/WorkCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { authClient } from "@/lib/auth-client";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { BookmarkIcon, TrashIcon, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTransition } from "react";

function ShelfHeader({ id }: { readonly id: string }) {
  const [t] = useT();
  const router = useRouter();
  const result = useAtomSuspense(shelfQuery(id));
  const shelf = result.value;
  const { data: session } = authClient.useSession();
  const deleteShelf = useAtomSet(deleteShelfAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();
  const isOwner = session?.user.id === shelf.ownerId;

  const handleDelete = () => {
    startTransition(async () => {
      await deleteShelf({ params: { id }, reactivityKeys: [Keys.shelves] });
      router.push("/library/shelves");
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BookmarkIcon className="size-5 shrink-0" />
        <h1 className="min-w-0 truncate text-xl font-semibold">{shelf.name}</h1>
        <Badge className="shrink-0" variant="outline">
          {shelf.isPublic ? t.library.shelf.public : t.library.shelf.private}
        </Badge>
        <span className="text-muted-foreground shrink-0 text-sm">{t.library.shelf.itemCount(shelf.itemCount)}</span>
      </div>
      {isOwner && (
        <Button className="shrink-0" disabled={isPending} onClick={handleDelete} size="icon-sm" variant="ghost">
          <TrashIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}

function ShelfItems({ id }: { readonly id: string }) {
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const shelfResult = useAtomSuspense(shelfQuery(id));
  const isOwner = session?.user.id === shelfResult.value.ownerId;

  return (
    <PagedList
      className="gap-4"
      emptyState={<EmptyState icon={<BookmarkIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => shelfItemsQuery(id, offset)}
      renderContainer={(pages) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {pages}
        </div>
      )}
      renderPage={(items) =>
        items.map((item) => (
          <div className="flex flex-col gap-1" key={item.id}>
            <WorkCard work={item.work} />
            {item.note && <p className="text-muted-foreground truncate text-xs">{item.note}</p>}
            {isOwner && <RemoveItemButton itemWorkId={item.work.id} shelfId={id} />}
          </div>
        ))
      }
    />
  );
}

function RemoveItemButton({ shelfId, itemWorkId }: { readonly shelfId: string; readonly itemWorkId: string }) {
  const removeItem = useAtomSet(removeShelfItemAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await removeItem({ params: { id: shelfId }, query: { workId: itemWorkId }, reactivityKeys: [Keys.shelves, Keys.shelfItems(shelfId)] });
        });
      }}
      size="xs"
      variant="ghost"
    >
      <XIcon className="size-3" />
    </Button>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | [bk] Shelf Name    [Public] 12 items [x] |
 * |  ^shrink-0 ^min-w-0+truncate  ^shrink-0   |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | note.. | note.. |                       |
 * | [x]   | [x]   |  <- remove (owner only) |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | [bk] Shelf Name     [Public] 12 items        [x]  |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     [bk] Shelf Name  [Public] 12 items              [x]   |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         [bk] Shelf Name  [Public] 12 items               [x]        |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl 居中容器。
 * 头部行：图标(shrink-0) + 名称(min-w-0 truncate) + 可见性徽章(shrink-0) +
 * 条目数(shrink-0) + 删除按钮(shrink-0, owner only)。justify-between 推开
 * 标题区(flex-1 min-w-0)和删除按钮。
 * 网格 2/3/4/5 列。每卡下方可有 note(truncate) + 移除按钮(owner only)。
 * 边界：0 条目 → EmptyState。非 owner → 不显示删除/移除按钮。
 */
export default function ShelfDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <SectionBoundary>
        <ShelfHeader id={params.id} />
      </SectionBoundary>
      <SectionBoundary>
        <ShelfItems id={params.id} />
      </SectionBoundary>
    </div>
  );
}
