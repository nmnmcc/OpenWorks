"use client";

import { Keys } from "@/atoms/keys";
import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import { workPostsPageQuery } from "@/atoms/posts";
import {
  deleteRatingAtom,
  setRatingAtom,
  workChaptersQuery,
  workCreditsQuery,
  workQuery,
  workRatingQuery,
  workRequirementsQuery,
  workSpacesQuery,
  workTagsQuery,
  workVariantsQuery,
} from "@/atoms/works";
import { LibraryStatusControl } from "@/components/library/LibraryStatusControl";
import { RatingStars } from "@/components/library/RatingStars";
import { ShelfPickerMenu } from "@/components/library/ShelfPickerMenu";
import { WorkCard } from "@/components/library/WorkCard";
import { WorkTagChips } from "@/components/library/WorkTagChips";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import {
  BookOpenIcon,
  CheckIcon,
  ExternalLinkIcon,
  FilmIcon,
  GamepadIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  TvIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTransition } from "react";

const typeIcon: Record<string, typeof BookOpenIcon> = {
  book: BookOpenIcon,
  movie: FilmIcon,
  tv: TvIcon,
  game: GamepadIcon,
};

function WorkHeader({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workQuery(id));
  const work = result.value;
  const Icon = typeIcon[work.type] ?? BookOpenIcon;
  const year = work.releaseDate ? new Date(work.releaseDate).getFullYear() : null;
  const average = work.ratingCount > 0 ? (work.ratingSum / work.ratingCount).toFixed(1) : null;
  const recommendedPct = work.ratingCount > 0 ? Math.round((work.recommendedCount / work.ratingCount) * 100) : null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="bg-muted flex aspect-2/3 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg sm:w-48">
        {work.coverUrl ? (
          <img alt={work.title} className="size-full object-cover" src={work.coverUrl} />
        ) : (
          <Icon className="text-muted-foreground size-16" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-2xl font-bold wrap-anywhere">{work.title}</h1>
        {work.originalTitle && <p className="text-muted-foreground text-sm wrap-anywhere">{work.originalTitle}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{t.library.type[work.type as keyof typeof t.library.type] ?? work.type}</Badge>
          {year && <span className="text-muted-foreground text-sm">{year}</span>}
          {work.nsfw && <Badge variant="destructive">{t.library.nsfw}</Badge>}
          {work.targetWorkId && (
            <Badge variant="outline">
              {t.library.variant} ·{" "}
              <Link className="underline" href={`/library/works/${work.targetWorkId}`}>
                {t.library.mainWork}
              </Link>
            </Badge>
          )}
        </div>

        {average && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold">{average}</span>
            <div className="flex flex-col">
              <RatingStars readOnly value={Math.round(work.ratingSum / work.ratingCount)} />
              <span className="text-muted-foreground text-xs">
                {t.library.rating.count(work.ratingCount)}
                {recommendedPct !== null && ` · ${recommendedPct}% ${t.library.rating.recommended}`}
              </span>
            </div>
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <LibraryStatusControl workId={id} />
          <MyRating workId={id} />
          <ShelfPickerMenu workId={id} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/library/works/${id}/edit`}>
              <PencilIcon className="size-4" />
              {t.common.edit}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MyRating({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workRatingQuery(workId));
  const setRating = useAtomSet(setRatingAtom, { mode: "promise" });
  const deleteRating = useAtomSet(deleteRatingAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();
  const currentValue = result.value?.value as number | undefined;

  return (
    <div className={cn("flex items-center gap-1", isPending && "pointer-events-none opacity-50")}>
      <RatingStars
        onValueChange={(value) => {
          startTransition(async () => {
            await setRating({
              params: { id: workId },
              payload: { value },
              reactivityKeys: [Keys.workRating(workId), Keys.work(workId)],
            });
          });
        }}
        value={currentValue}
      />
      {currentValue !== undefined && (
        <Button
          onClick={() => {
            startTransition(async () => {
              await deleteRating({
                params: { id: workId },
                reactivityKeys: [Keys.workRating(workId), Keys.work(workId)],
              });
            });
          }}
          size="icon-xs"
          variant="ghost"
        >
          <XIcon className="size-3" />
        </Button>
      )}
    </div>
  );
}

function OverviewTab({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workQuery(id));
  const work = result.value;

  return (
    <div className="flex flex-col gap-4">
      {work.description && <PortableTextView value={work.description} />}

      <SectionBoundary>
        <TagsSection workId={id} />
      </SectionBoundary>

      <SectionBoundary>
        <CreditsSection workId={id} />
      </SectionBoundary>

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-medium">{t.library.overview}</h3>
        <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {work.isbn && (
            <>
              <span>{t.library.isbn}</span>
              <span>{work.isbn}</span>
            </>
          )}
          {work.pageCount && (
            <>
              <span>{t.library.pageCount}</span>
              <span>{work.pageCount}</span>
            </>
          )}
          {work.runtimeMinutes && (
            <>
              <span>{t.library.runtime}</span>
              <span>{t.library.runtimeMinutes(work.runtimeMinutes)}</span>
            </>
          )}
          {work.seasonCount && (
            <>
              <span>{t.library.seasons}</span>
              <span>{work.seasonCount}</span>
            </>
          )}
          {work.episodeCount && (
            <>
              <span>{t.library.episodes}</span>
              <span>{work.episodeCount}</span>
            </>
          )}
          {work.platforms && work.platforms.length > 0 && (
            <>
              <span>{t.library.platforms}</span>
              <span>{work.platforms.join(", ")}</span>
            </>
          )}
          {work.website && (
            <>
              <span>{t.library.website}</span>
              <a
                className="text-info-foreground truncate underline"
                href={work.website}
                rel="noreferrer noopener"
                target="_blank"
              >
                {work.website} <ExternalLinkIcon className="inline size-3" />
              </a>
            </>
          )}
        </div>
      </Card>

      {work.type === "game" && (
        <SectionBoundary>
          <RequirementsSection workId={id} />
        </SectionBoundary>
      )}

      <SectionBoundary>
        <RelatedSpacesSection workId={id} />
      </SectionBoundary>
    </div>
  );
}

function RelatedSpacesSection({ workId }: { readonly workId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workSpacesQuery(workId));
  if (result.value.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t.library.relatedSpaces}</h3>
      <div className="flex flex-wrap gap-2">
        {result.value.map((space) => (
          <Link
            className="hover:bg-accent flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors"
            href={`/spaces/${space.id}`}
            key={space.id}
          >
            <Avatar size="sm">
              <AvatarImage alt={space.name} src={space.icon ?? undefined} />
              <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate text-sm font-medium">{space.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{t.spaces.members(space.memberCount)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TagsSection({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workTagsQuery(workId));
  if (result.value.length === 0) return null;
  return <WorkTagChips tags={result.value} />;
}

function CreditsSection({ workId }: { readonly workId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workCreditsQuery(workId));
  if (result.value.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t.library.credits}</h3>
      <div className="flex flex-col gap-1">
        {result.value.map((credit) => (
          <div className="flex items-center gap-2 text-sm" key={`${credit.creatorId}-${credit.role}`}>
            <Link className="font-medium hover:underline" href={`/library/creators/${credit.creatorId}`}>
              {credit.creatorName}
            </Link>
            <Badge variant="outline">{t.library.role[credit.role as keyof typeof t.library.role] ?? credit.role}</Badge>
            {credit.characterName && <span className="text-muted-foreground">as {credit.characterName}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementsSection({ workId }: { readonly workId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workRequirementsQuery(workId));
  if (result.value.length === 0) return null;

  const grouped = new Map<string, typeof result.value>();
  for (const req of result.value) {
    const existing = grouped.get(req.platform) ?? [];
    grouped.set(req.platform, [...existing, req]);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t.library.requirements}</h3>
      {Array.from(grouped.entries()).map(([platform, reqs]) => (
        <Card className="p-3" key={platform}>
          <h4 className="mb-2 text-sm font-medium capitalize">{platform}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reqs.map((req) => (
              <div className="flex flex-col gap-1" key={req.tier}>
                <span className="text-muted-foreground text-xs font-medium">
                  {t.library.requirement[req.tier as keyof typeof t.library.requirement] ?? req.tier}
                </span>
                {req.os && (
                  <span className="text-xs">
                    {t.library.requirement.os}: {req.os}
                  </span>
                )}
                {req.cpu && (
                  <span className="text-xs">
                    {t.library.requirement.cpu}: {req.cpu}
                  </span>
                )}
                {req.memory && (
                  <span className="text-xs">
                    {t.library.requirement.memory}: {req.memory}
                  </span>
                )}
                {req.graphics && (
                  <span className="text-xs">
                    {t.library.requirement.graphics}: {req.graphics}
                  </span>
                )}
                {req.storage && (
                  <span className="text-xs">
                    {t.library.requirement.storage}: {req.storage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChaptersTab({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workChaptersQuery(id));

  if (result.value.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t.common.noResults}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {result.value.map((chapter, index) => (
        <Link
          className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
          href={`/library/works/${id}/chapters/${chapter.id}`}
          key={chapter.id}
        >
          <span className="text-muted-foreground w-8 shrink-0 text-right text-sm">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate text-sm">{chapter.title}</span>
          {chapter.isRead && <CheckIcon className="text-primary size-4 shrink-0" />}
        </Link>
      ))}
    </div>
  );
}

function VariantsTab({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workVariantsQuery(id));

  if (result.value.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t.common.noResults}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {result.value.map((variant) => (
        <WorkCard key={variant.id} work={variant} />
      ))}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | +--------------------------------------+ |
 * | |           [cover img]                | |
 * | |           (aspect-2/3 w-full)        | |
 * | +--------------------------------------+ |
 * | Title (h1, wrap-anywhere)               |
 * | Original Title                          |
 * | [Book] 2010 [NSFW]                     |
 * | 8.4 ★★★★☆ 42 ratings · 95%            |
 * | [+ Library] [★★★★☆] [+ Shelf] [Edit]  |
 * |  ^--- flex-wrap, each shrink-0 ---^     |
 * |                                         |
 * | [Overview][Content][Reviews][Disc][Ed]  |
 * |  ^--- TabsList overflow-x-auto ---^     |
 * | <TabsContent>                           |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | +-------+ Title (h1)                               |
 * | | cover | Original Title                           |
 * | | w-48  | [Book] 2010                              |
 * | |       | 8.4  ★★★★☆ 42 ratings                   |
 * | |       | [+ Library][★★★★☆][+ Shelf][Edit]        |
 * | +-------+                                         |
 * | [Overview] [Content] [Reviews] [Disc] [Editions]  |
 * | <TabsContent>                                     |
 * +----------------------------------------------------+
 *         w-full max-w-4xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     +-------+ Title (h1)                                   |
 * |     | cover | Original Title                               |
 * |     | w-48  | [Book] 2010                                  |
 * |     |       | 8.4 ★★★★☆ 42 ratings · 95% Recommended      |
 * |     |       | [+ Library] [★★★★☆] [+ Shelf] [Edit]        |
 * |     +-------+                                             |
 * |     [Overview] [Content] [Reviews] [Disc] [Editions]      |
 * |     <TabsContent -- flex-1 min-w-0>                       |
 * +------------------------------------------------------------+
 *           w-full max-w-4xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         +-------+ Title (h1)                                         |
 * |         | cover | Original Title                                     |
 * |         | w-48  | [Book] 2010                                        |
 * |         |       | 8.4 ★★★★☆ 42 ratings · 95% Recommended            |
 * |         |       | [+ Library] [★★★★☆] [+ Shelf] [Edit]              |
 * |         +-------+                                                   |
 * |         [Overview] [Content] [Reviews] [Disc] [Editions]            |
 * |         <TabsContent>                                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-4xl mx-auto
 *
 * max-w-4xl (56rem) 居中容器。
 * 头部：< sm 时封面占满宽度、信息垂直排列；>= sm 时水平排列（封面 w-48
 * shrink-0 + 信息 flex-1 min-w-0），标题 wrap-anywhere（超长不溢出）。
 * 评分块：大数字 + 星 + 计数 + 好评率 %，flex-wrap 窄端折行。
 * 操作行：四个控件 flex-wrap，每个 shrink-0，320px 下折为两行。
 * 五标签页 TabsList：窄端可横滑。
 * 概览 = 简介 + 标签 + 演职员 + 详情卡 + 外部链接 + 配置需求（game only）
 *        + 相关社区（flex-wrap 徽章行：头像 shrink-0 + 名称 min-w-0 truncate
 *        + 成员数 shrink-0；空列表整节不渲染）。
 * 内容 = 章节列表（编号 shrink-0 w-8 + 标题 flex-1 truncate + 已读 ✓ shrink-0）。
 * 评测/讨论 = 顶部右对齐 [+ 写评测 / 发讨论] 按钮（打开发帖弹窗并预填
 *        本作品；评测模式锁定 review 页签）+ PostCard 列表。
 * 版本 = WorkCard 网格 2/3/4 列。
 * 边界：无封面 → 灰底+类型图标。无评分 → 隐藏评分块。0 章节/变体 → 空提示。
 *       变体本身也显示"主条目"回链徽章。
 */
export default function WorkDetailPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <SectionBoundary>
        <WorkHeader id={params.id} />
      </SectionBoundary>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t.library.overview}</TabsTrigger>
          <TabsTrigger value="content">{t.library.content}</TabsTrigger>
          <TabsTrigger value="reviews">{t.library.reviews}</TabsTrigger>
          <TabsTrigger value="discussions">{t.library.discussions}</TabsTrigger>
          <TabsTrigger value="variants">{t.library.variants}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <SectionBoundary>
            <OverviewTab id={params.id} />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="content">
          <SectionBoundary>
            <ChaptersTab id={params.id} />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="reviews">
          <SectionBoundary>
            <PostsForWork kind="review" workId={params.id} />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="discussions">
          <SectionBoundary>
            <PostsForWork kind="discussion" workId={params.id} />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="variants">
          <SectionBoundary>
            <VariantsTab id={params.id} />
          </SectionBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostsForWork({ workId, kind }: { readonly workId: string; readonly kind: "review" | "discussion" }) {
  const [t] = useT();
  const setPostComposeDialog = useAtomSet(postComposeDialogAtom);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          onClick={() => setPostComposeDialog({ open: true, spaceId: "", workId, isReview: kind === "review" })}
          size="sm"
          variant="outline"
        >
          <PlusIcon />
          {kind === "review" ? t.library.writeReview : t.library.startDiscussion}
        </Button>
      </div>
      <PagedList
        className="gap-3"
        emptyState={<EmptyState icon={<MessageSquareIcon />} title={t.common.noResults} />}
        pageQuery={(offset) => workPostsPageQuery({ workId, kind, sort: "new", offset })}
        renderPage={(posts) => posts.map((post) => <PostCard hideWork key={post.id} post={post} />)}
      />
    </div>
  );
}
