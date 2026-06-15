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

export function MyLibraryContent() {
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
