"use client";

import { PAGE_SIZE } from "@/atoms/posts";
import { spaceSearchQuery, spacesPageQuery } from "@/atoms/spaces";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { CreateSpaceDialog } from "@/components/space/CreateSpaceDialog";
import { SpaceCard } from "@/components/space/SpaceCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { SearchIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState, type FormEvent } from "react";

function SpaceList() {
  const [t] = useT();

  return (
    <PagedList
      className="gap-3"
      emptyState={<EmptyState icon={<UsersIcon />} title={t.spaces.empty} />}
      pageQuery={spacesPageQuery}
      renderPage={(spaces) => spaces.map((space) => <SpaceCard space={space} key={space.id} />)}
    />
  );
}

function SpaceSearchResults({ q }: { readonly q: string }) {
  const [pageCount, setPageCount] = useState(1);
  const offsets = Array.from({ length: pageCount }, (_, i) => i * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      {offsets.map((offset) => (
        <SectionBoundary key={offset}>
          <SpaceSearchPage
            isLast={offset === (pageCount - 1) * PAGE_SIZE}
            offset={offset}
            onLoadMore={() => setPageCount((c) => c + 1)}
            q={q}
          />
        </SectionBoundary>
      ))}
    </div>
  );
}

function SpaceSearchPage({ q, offset, isLast, onLoadMore }: { readonly q: string; readonly offset: number; readonly isLast: boolean; readonly onLoadMore: () => void }) {
  const [t] = useT();
  const result = useAtomSuspense(spaceSearchQuery(q, offset));
  const { hits, estimatedTotalHits } = result.value;

  if (offset === 0 && hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {offset === 0 && <p className="text-muted-foreground text-sm">{t.search.resultCount(estimatedTotalHits)}</p>}
      {hits.map((space) => (
        <Card className="flex-row items-center gap-2.5 p-3 [--space:--spacing(3)]" key={space.id}>
          <Avatar size="md">
            <AvatarImage alt={space.name} src={space.icon ?? undefined} />
            <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Link className="truncate text-sm font-medium hover:underline" href={`/spaces/${space.id}`}>
              {space.name}
            </Link>
            <span className="text-muted-foreground truncate text-xs">{t.spaces.members(space.memberCount)}</span>
          </div>
        </Card>
      ))}
      {isLast && hits.length === PAGE_SIZE && (
        <Button className="self-center" onClick={onLoadMore} variant="outline">
          {t.common.loadMore}
        </Button>
      )}
    </>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Spaces                    [+ Create]     |
 * | [____search input____] [Search]          |
 * | +--------------------------------------+ |
 * | | [SpaceCard]                          | |
 * | +--------------------------------------+ |
 * | | [SpaceCard]                          | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Spaces                          [+ Create]     |
 * | [____search input___________] [Search]         |
 * | +--------------------------------------------+ |
 * | | [SpaceCard]                                | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Spaces                          [+ Create]     |
 * |       [____search input___________] [Search]         |
 * |       +--------------------------------------------+ |
 * |       | [SpaceCard]                                | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Spaces                          [+ Create]          |
 * |            [____search input___________] [Search]              |
 * |            +--------------------------------------------+      |
 * |            | [SpaceCard]                                |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 标题行宽度处置：h1 与 [+ Create] 均为固定短标签（按钮自带 shrink-0），
 * justify-between 推开两端，320px 下两者合计仍小于行宽；宽端留白落在中间。
 * 搜索行：input(min-w-0 flex-1) + 搜索按钮(shrink-0)；nuqs 管理 ?q= 参数。
 * 有搜索词时切换为搜索结果列表（带分页）；无搜索词时显示全部社区列表（PagedList）。
 * 边界：0 个空间 → EmptyState（用户组图标）。
 *       0 搜索结果 → EmptyState（搜索图标）。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function SpacesPage() {
  const [t] = useT();
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [input, setInput] = useState(q);
  const trimmed = q.trim();

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setQ(input.trim() || null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.spaces.title}</h1>
        <CreateSpaceDialog />
      </div>
      <form className="mb-4 flex items-center gap-2" onSubmit={handleSearch}>
        <Input className="min-w-0 flex-1" onChange={(e) => setInput(e.target.value)} placeholder={t.nav.searchPlaceholder} value={input} />
        <Button className="shrink-0" size="sm" type="submit">
          <SearchIcon className="size-4" />
        </Button>
      </form>
      <SectionBoundary key={trimmed}>
        {trimmed ? <SpaceSearchResults q={trimmed} /> : <SpaceList />}
      </SectionBoundary>
    </div>
  );
}
