"use client";

import { Keys } from "@/atoms/keys";
import { addSpaceWorkAtom, removeSpaceWorkAtom, spaceWorksPageQuery } from "@/atoms/spaces";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { WorkPicker } from "@/components/shared/WorkPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { BookIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

function WorksSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const addWork = useAtomSet(addSpaceWorkAtom, { mode: "promise" });
  const removeWork = useAtomSet(removeSpaceWorkAtom, { mode: "promise" });

  const [pickedWorkId, setPickedWorkId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (pickedWorkId === undefined) return;
    setBusy(true);
    try {
      await addWork({
        params: { id: spaceId },
        payload: { workId: pickedWorkId },
        reactivityKeys: [Keys.spaceWorks(spaceId)],
      });
      setPickedWorkId(undefined);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(workId: string) {
    try {
      await removeWork({
        params: { id: spaceId, workId },
        reactivityKeys: [Keys.spaceWorks(spaceId)],
      });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">{t.mod.works.title}</h2>

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <WorkPicker onValueChange={setPickedWorkId} placeholder={t.composer.searchWork} value={pickedWorkId} />
        </div>
        <Button disabled={pickedWorkId === undefined} isLoading={busy} onClick={handleAdd} className="shrink-0">
          {t.mod.works.add}
        </Button>
      </div>

      <PagedList
        className="gap-2"
        emptyState={<EmptyState icon={<BookIcon />} title={t.mod.works.empty} />}
        pageQuery={(offset) => spaceWorksPageQuery(spaceId, offset)}
        renderPage={(entries) =>
          entries.map((entry) => (
            <Card className="flex-row items-center gap-2.5 p-3 [--space:--spacing(3)]" key={entry.id}>
              {entry.work.coverUrl !== null ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={entry.work.title}
                  className="h-12 w-8 shrink-0 rounded-sm object-cover"
                  src={entry.work.coverUrl}
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-12 w-8 shrink-0 items-center justify-center rounded-sm">
                  <BookIcon className="size-4" />
                </div>
              )}
              <div className="flex min-w-0 flex-col">
                <Link className="truncate text-sm font-medium hover:underline" href={`/library/works/${entry.work.id}`}>
                  {entry.work.title}
                </Link>
                <Badge className="w-fit" variant="outline">
                  {t.library.type[entry.work.type as keyof typeof t.library.type] ?? entry.work.type}
                </Badge>
              </div>
              <Button
                aria-label={t.common.delete}
                className="text-destructive ml-auto shrink-0"
                onClick={() => handleRemove(entry.work.id)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2Icon />
              </Button>
            </Card>
          ))
        }
      />
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +----------------------------------------------+
 * | Related Works                                |
 * | [s] Search works... (flex-1)     [Add]      |
 * |  ^min-w-0 shrinks                 ^shrink-0  |
 * |----------------------------------------------|
 * | [cv] Work Title (truncate) [Book]   [Delete] |
 * | [cv] Another Work (trunc.) [Game]   [Delete] |
 * | [Load more]  (PagedList, full pages only)    |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 本页自身无断点，所有视口下结构一致。
 *
 * 社区相关作品管理：顶部 WorkPicker（搜索选择，禁止手输 ID）+ Add 按钮
 * （未选中时 disabled）；下方 PagedList 分页列表。
 * 宽度处置：选择行 = WorkPicker 容器 flex-1 min-w-0（宽端伸展吃满余宽、
 * 窄端收缩）+ Add 按钮 shrink-0，两者同为 md 档等高；列表行 = 封面缩略
 * shrink-0 + 标题 min-w-0 truncate + 类型徽章 w-fit + ml-auto 删除按钮
 * shrink-0。
 * 边界：0 个关联作品 → EmptyState；重复添加 → 409 错误 toast
 * （SpaceWorkConflict）；非版主访问 → ModBoundary 拦截。
 */
export default function ModWorksPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <WorksSection spaceId={params.id} />
    </ModBoundary>
  );
}
