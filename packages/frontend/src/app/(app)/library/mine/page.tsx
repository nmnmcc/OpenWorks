"use client";

import { libraryPageQuery } from "@/atoms/library";
import { SectionBoundary } from "@/components/SectionBoundary";
import { LibraryStatusControl } from "@/components/library/LibraryStatusControl";
import { WorkCard } from "@/components/library/WorkCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { useT } from "@/lib/i18n/locale";
import { BookOpenIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

const STATUSES = ["all", "want", "active", "completed", "on_hold", "dropped"] as const;

function MyLibraryList({ status }: { readonly status?: string }) {
  const [t] = useT();

  return (
    <PagedList
      className="gap-4"
      emptyState={<EmptyState icon={<BookOpenIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => libraryPageQuery({ status, offset })}
      renderContainer={(pages) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {pages}
        </div>
      )}
      renderPage={(items) =>
        items.map((item) => (
          <div className="flex flex-col gap-1" key={item.id}>
            <WorkCard work={item.work} />
            <LibraryStatusControl className="w-full" workId={item.work.id} />
          </div>
        ))
      }
    />
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | My Library              [Status v]       |
 * |  ^min-w-0 truncate        ^shrink-0 w-32 |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | [Stat] | [Stat] |                       |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | My Library                        [Status v]       |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | |Title | |Title | |Title |                        |
 * | [Stat] | [Stat] | [Stat] |                        |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     My Library                          [Status v]         |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     |Title | |Title | |Title | |Title |                   |
 * |     [Stat] | [Stat] | [Stat] | [Stat] |                   |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         My Library                              [Status v]           |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         |Title | |Title | |Title | |Title | |Title |               |
 * |         [Stat] | [Stat] | [Stat] | [Stat] | [Stat] |               |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl 居中容器。标题行 justify-between，h1 与 status select
 * 分居两端；h1 min-w-0 truncate，select shrink-0 w-32。
 * 每卡下方嵌 LibraryStatusControl（w-full 等宽于卡片）。
 * 网格 2/3/4/5 列（sm/lg/2xl 断点），PagedList 分页。
 * 边界：0 个条目 → EmptyState。状态筛选 all = 不筛选。
 */
export default function MyLibraryPage() {
  const [t] = useT();
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const effectiveStatus = status === "all" ? undefined : status;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="min-w-0 truncate text-xl font-semibold">{t.library.myLibrary}</h1>
        <SimpleSelect
          className="w-32 shrink-0"
          items={STATUSES.map((s) => ({
            value: s,
            label: s === "all" ? t.library.browse : t.library.status[s],
          }))}
          onChange={(val) => void setStatus(val === "all" ? null : val)}
          value={status}
        />
      </div>

      <SectionBoundary>
        <MyLibraryList key={status} status={effectiveStatus} />
      </SectionBoundary>
    </div>
  );
}
