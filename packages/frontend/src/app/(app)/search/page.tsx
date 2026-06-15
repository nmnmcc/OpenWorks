"use client";

import { creatorsPageQuery } from "@/atoms/creators";
import { PAGE_SIZE, searchQuery } from "@/atoms/posts";
import { spaceSearchQuery } from "@/atoms/spaces";
import { userSearchQuery } from "@/atoms/users";
import { workSearchQuery } from "@/atoms/works";
import { WorkCard } from "@/components/library/WorkCard";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useState, type ReactNode } from "react";

const SEARCH_TYPES = ["posts", "works", "creators", "spaces", "users"] as const;

type SearchType = (typeof SEARCH_TYPES)[number];

interface PageProps {
  readonly q: string;
  readonly offset: number;
  readonly isLast: boolean;
  readonly onLoadMore: () => void;
}

function LoadMore({ visible, onLoadMore }: { readonly visible: boolean; readonly onLoadMore: () => void }) {
  const [t] = useT();
  if (!visible) return null;
  return (
    <Button className="self-center" onClick={onLoadMore} variant="outline">
      {t.common.loadMore}
    </Button>
  );
}

function PostsPage({ q, offset, isLast, onLoadMore }: PageProps) {
  const [t] = useT();
  const result = useAtomSuspense(searchQuery({ q, offset }));
  const { hits, estimatedTotalHits } = result.value;

  if (offset === 0 && hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {offset === 0 && <p className="text-muted-foreground text-sm">{t.search.resultCount(estimatedTotalHits)}</p>}
      {hits.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <LoadMore onLoadMore={onLoadMore} visible={isLast && hits.length === PAGE_SIZE} />
    </>
  );
}

function WorksPage({ q, offset, isLast, onLoadMore }: PageProps) {
  const [t] = useT();
  const result = useAtomSuspense(workSearchQuery(q, undefined, offset));
  const { hits, estimatedTotalHits } = result.value;

  if (offset === 0 && hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {offset === 0 && <p className="text-muted-foreground text-sm">{t.search.resultCount(estimatedTotalHits)}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {hits.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
      <LoadMore onLoadMore={onLoadMore} visible={isLast && hits.length === PAGE_SIZE} />
    </>
  );
}

function CreatorsPage({ q, offset, isLast, onLoadMore }: PageProps) {
  const [t] = useT();
  const result = useAtomSuspense(creatorsPageQuery(q, offset));
  const creators = result.value;

  if (offset === 0 && creators.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {creators.map((creator) => (
        <Card className="flex-row items-center gap-2.5 p-3 [--space:--spacing(3)]" key={creator.id}>
          <Avatar size="md">
            <AvatarImage alt={creator.name} src={creator.imageUrl ?? undefined} />
            <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link
            className="min-w-0 truncate text-sm font-medium hover:underline"
            href={`/library/creators/${creator.id}`}
          >
            {creator.name}
          </Link>
          <Badge className="ml-auto shrink-0" variant="outline">
            {creator.kind === "person" ? t.library.person : t.library.organization}
          </Badge>
        </Card>
      ))}
      <LoadMore onLoadMore={onLoadMore} visible={isLast && creators.length === PAGE_SIZE} />
    </>
  );
}

function SpacesPage({ q, offset, isLast, onLoadMore }: PageProps) {
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
      <LoadMore onLoadMore={onLoadMore} visible={isLast && hits.length === PAGE_SIZE} />
    </>
  );
}

function UsersPage({ q, offset, isLast, onLoadMore }: PageProps) {
  const [t] = useT();
  const result = useAtomSuspense(userSearchQuery(q, offset));
  const { hits, estimatedTotalHits } = result.value;

  if (offset === 0 && hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {offset === 0 && <p className="text-muted-foreground text-sm">{t.search.resultCount(estimatedTotalHits)}</p>}
      {hits.map((user) => (
        <Card className="flex-row items-center gap-2.5 p-3 [--space:--spacing(3)]" key={user.id}>
          <Avatar size="md">
            <AvatarImage alt={user.name} src={user.image ?? undefined} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Link className="truncate text-sm font-medium hover:underline" href={`/users/${user.id}`}>
              {user.displayName ?? user.name}
            </Link>
            <span className="text-muted-foreground truncate text-xs">@{user.name}</span>
          </div>
        </Card>
      ))}
      <LoadMore onLoadMore={onLoadMore} visible={isLast && hits.length === PAGE_SIZE} />
    </>
  );
}

const PAGE_COMPONENTS: Record<SearchType, (props: PageProps) => ReactNode> = {
  posts: PostsPage,
  works: WorksPage,
  creators: CreatorsPage,
  spaces: SpacesPage,
  users: UsersPage,
};

function SearchResults({ q, type }: { readonly q: string; readonly type: SearchType }) {
  const [pageCount, setPageCount] = useState(1);
  const offsets = Array.from({ length: pageCount }, (_, index) => index * PAGE_SIZE);
  const Page = PAGE_COMPONENTS[type];

  return (
    <div className="flex flex-col gap-3">
      {offsets.map((offset) => (
        <SectionBoundary key={offset}>
          <Page
            isLast={offset === (pageCount - 1) * PAGE_SIZE}
            offset={offset}
            onLoadMore={() => setPageCount((count) => count + 1)}
            q={q}
          />
        </SectionBoundary>
      ))}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | "Results for: query"        |
 * | [Posts|Works|Creators|...]  |
 * |  ^ TabsList max-w-full,     |
 * |    horizontal scroll        |
 * | N results                   |
 * | [PostCard / row Card]       |
 * | [PostCard / row Card]       |
 * |       [Load more]          |
 * +-----------------------------+
 * w-full, single column. Works
 * tab: 2-col WorkCard grid.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | "Results for: query"                 |
 * | [Posts][Works][Creators][Sp][Users]  |
 * | N results                            |
 * | [PostCard]  (works: 3-col grid)      |
 * |           [Load more]               |
 * +--------------------------------------+
 * max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | "Results for: query"                     |
 * | [Posts][Works][Creators][Spaces][Users]  |
 * | N results                                |
 * | [PostCard]  (works: 4-col grid)          |
 * |           [Load more]                    |
 * +------------------------------------------+
 * max-w-3xl centered.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      "Results for: query"                        |
 * |      [Posts][Works][Creators][Spaces][Users]     |
 * |      N results                                   |
 * |      [PostCard]  (works: 4-col grid)             |
 * |               [Load more]                        |
 * +--------------------------------------------------+
 * max-w-3xl (48rem) centered, symmetric mx-auto margins.
 *
 * 联邦搜索页：w-full max-w-3xl mx-auto 居中容器。nuqs 管理 ?q= 与 ?type=
 * （posts|works|creators|spaces|users，默认 posts）。分类 Tabs 切换结果
 * 类型；切换即重置分页（key={`${q}:${type}`} 重挂）。
 * 宽度处置：标题含用户输入查询串 wrap-anywhere；TabsList w-fit max-w-full
 * + overflow-x-auto（Mobile 横滑，永不换行/截断）；行卡片 = 头像/封面
 * shrink-0 + 名称 min-w-0 truncate + 徽章/计数 shrink-0（creators 徽章
 * ml-auto 吃右侧余宽）；Works 用 WorkCard 网格 2/3/4 列随断点变化。
 * 边界：q 为空 → 搜索提示 EmptyState；0 结果 → 空结果 EmptyState；
 *       分页 offset 追加，每页 PAGE_SIZE 条，末页满载显示"加载更多"。
 */
export default function SearchPage() {
  const [t] = useT();
  const [{ q: rawQ, type }, setParams] = useQueryStates({
    q: parseAsString.withDefault(""),
    type: parseAsStringLiteral(SEARCH_TYPES).withDefault("posts"),
  });
  const q = rawQ.trim();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold wrap-anywhere">{q.length > 0 ? t.search.resultsFor(q) : t.search.title}</h1>
      <Tabs onValueChange={(details) => setParams({ type: details.value as SearchType })} value={type}>
        <TabsList>
          {SEARCH_TYPES.map((searchType) => (
            <TabsTrigger key={searchType} value={searchType}>
              {t.search.tabs[searchType]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {q.length === 0 ? (
        <EmptyState icon={<SearchIcon />} title={t.search.prompt} />
      ) : (
        <SearchResults key={`${q}:${type}`} q={q} type={type} />
      )}
    </div>
  );
}
