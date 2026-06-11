"use client";

import { libraryPageQuery } from "@/atoms/library";
import { userQuery } from "@/atoms/users";
import { SectionBoundary } from "@/components/SectionBoundary";
import { WorkCard } from "@/components/library/WorkCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { BookOpenIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";

const STATUSES = ["all", "want", "active", "completed", "on_hold", "dropped"] as const;

function UserLibraryList({ userId, status }: { readonly userId: string; readonly status?: string }) {
  const [t] = useT();

  return (
    <PagedList
      className="gap-4"
      emptyState={<EmptyState icon={<BookOpenIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => libraryPageQuery({ userId, status, offset })}
      renderContainer={(pages) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {pages}
        </div>
      )}
      renderPage={(items) => items.map((item) => <WorkCard key={item.id} work={item.work} />)}
    />
  );
}

function UserLibraryHeader({ userId }: { readonly userId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(userQuery(userId));

  return (
    <h1 className="min-w-0 truncate text-xl font-semibold">
      {t.library.userLibrary(result.value.displayName ?? result.value.name)}
    </h1>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | User's Library            [Status v]     |
 * |  ^min-w-0 truncate          ^shrink-0    |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | User's Library                      [Status v]     |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     User's Library                        [Status v]       |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         User's Library                          [Status v]           |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * 只读视图——他人公开库。标题行 justify-between，用户名 truncate，
 * select shrink-0 w-32。与 mine/page 复用相同网格和 PagedList，
 * 但无 LibraryStatusControl。
 * 边界：0 个条目 → EmptyState。
 */
export default function UserLibraryPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const effectiveStatus = status === "all" ? undefined : status;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionBoundary fallback={<div className="h-7" />}>
          <UserLibraryHeader userId={params.id} />
        </SectionBoundary>
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
        <UserLibraryList key={status} status={effectiveStatus} userId={params.id} />
      </SectionBoundary>
    </div>
  );
}
