"use client";

import { spaceQuery } from "@/atoms/spaces";
import { PostFeed } from "@/components/post/PostFeed";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { JoinButton } from "@/components/space/JoinButton";
import { SpaceSidebar } from "@/components/space/SpaceSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { Cause } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import { Button } from "@/components/ui/button";
import { LockIcon, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";

const SORTS = ["hot", "new", "top"] as const;
type SortKind = (typeof SORTS)[number];

function isTaggedError(error: unknown, tag: string): boolean {
  return typeof error === "object" && error !== null && "_tag" in error && error._tag === tag;
}

function SpaceView({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(spaceQuery(id), { includeFailure: true });
  const setPostComposeDialog = useAtomSet(postComposeDialogAtom);
  const [sort, setSort] = useQueryState("sort", parseAsStringLiteral(SORTS).withDefault("hot"));

  if (AsyncResult.isFailure(result)) {
    const error = Cause.squash(result.cause);
    const forbidden = isTaggedError(error, "SpaceForbidden");
    return (
      <EmptyState
        hint={forbidden ? t.spaces.privateBody : undefined}
        icon={<LockIcon />}
        title={forbidden ? t.spaces.privateTitle : t.errors.SpaceNotFound}
      />
    );
  }

  const space = result.value;

  return (
    <div className="flex flex-col gap-4">
      {space.banner !== null && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-32 w-full rounded-xl border object-cover sm:h-44" src={space.banner} />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Avatar size="lg">
          <AvatarImage alt={space.name} src={space.icon ?? undefined} />
          <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold wrap-anywhere">{space.name}</h1>
            {space.nsfw && <Badge variant="destructive">{t.post.nsfw}</Badge>}
          </div>
          <p className="text-muted-foreground truncate text-sm">{space.slug}</p>
        </div>
        <JoinButton spaceId={space.id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={() => setPostComposeDialog({ open: true, spaceId: space.id })} size="sm">
              <PlusIcon className="size-4" />
              {t.spaces.createPostHere}
            </Button>
            <SimpleSelect
              ariaLabel={t.feed.hot}
              className="w-32 shrink-0"
              items={[
                { value: "hot", label: t.feed.hot },
                { value: "new", label: t.feed.new },
                { value: "top", label: t.feed.top },
              ]}
              onChange={(value) => setSort(value as SortKind)}
              value={sort}
            />
          </div>
          <PostFeed hideSpace spaceId={space.id} key={sort} sort={sort} />
        </div>

        <SpaceSidebar space={space} />
      </div>
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | [Banner h-32 -- rounded-xl, border]      |
 * | (Avatar) Space Name [NSFW?]              |
 * |          slug                             |
 * |                         [Join/Leave]     |
 * |------------------------------------------|
 * | [+ Post]              [Sort: v Hot]     |
 * | [PostCard hideSpace]                     |
 * | [PostCard hideSpace]                     |
 * |------------------------------------------|
 * | [SpaceSidebar]                           |
 * +------------------------------------------+
 *            w-full (fills parent)
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]         |
 * | (Avatar) Space Name [NSFW?]                    |
 * |          slug                                  |
 * |                            [Join/Leave]        |
 * |------------------------------------------------|
 * | [+ Post]                   [Sort: v Hot]      |
 * | [PostCard hideSpace]                           |
 * | [PostCard hideSpace]                           |
 * |------------------------------------------------|
 * | [SpaceSidebar]                                 |
 * +------------------------------------------------+
 *            w-full (fills parent)
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]               |
 * | (Avatar) Space Name [NSFW?]                          |
 * |          slug                                        |
 * |                              [Join/Leave]            |
 * +------------------------------------------------------+
 * | [+ Post]              [Sort] | SpaceSidebar (18rem) |
 * | [PostCard hideSpace]          | Description          |
 * | [PostCard hideSpace]          | 42 members           |
 * |                               | Rules (accordion)    |
 * | (1fr)                         | [Wiki] [Mod Tools]   |
 * +-------------------------------+----------------------+
 *    lg:grid-cols-[1fr_18rem] gap-4
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]                        |
 * | (Avatar) Space Name [NSFW?]                                    |
 * |          slug                                                  |
 * |                                       [Join/Leave]             |
 * +----------------------------------------------------------------+
 * | [+ Post]             [Sort]           | SpaceSidebar (18rem)   |
 * | [PostCard hideSpace]                  | Description            |
 * | [PostCard hideSpace]                  | 42 members             |
 * |                                       | Rules (accordion)      |
 * | (1fr)                                 | [Wiki] [Mod Tools]     |
 * +---------------------------------------+------------------------+
 *    lg:grid-cols-[1fr_18rem] gap-4
 *
 * 无 max-w 包裹，填充父级宽度。banner 有条件渲染，<640px 时 h-32，>=640px 时 sm:h-44。
 * 头行宽度处置：头像自带 shrink-0；中间块 min-w-0 flex-1（吃掉余宽），
 * 名称 wrap-anywhere（超长无空格名断行）、slug 行 truncate；
 * Join/Leave 按钮 shrink-0，窄端经外层 flex-wrap 折到下一行。宽端：中间块伸展，按钮贴右。
 * 信息去重：成员数仅在 SpaceSidebar 显示（页头不重复）；帖子卡片隐藏社区名
 * （hideSpace，当前页上下文已确立）。
 * Feed 上方 [+ 发帖] 按钮预填 spaceId 打开 PostComposeDialog（与全局按钮
 * 的区别：全局按钮不预填社区，本地按钮预填当前社区——行为差异满足去重规则）。
 * Feed + Sidebar 区域：>=1024px (lg) 时 grid 双列 (1fr + 18rem)；<1024px 时单列堆叠，sidebar 在 feed 下方。
 * 边界：Forbidden → 显示私密空间提示 (EmptyState + LockIcon)。
 *       NotFound → 显示未找到提示。
 *       无 banner → 不渲染 banner 区域。
 */
export default function SpacePage() {
  const params = useParams<{ id: string }>();

  return (
    <SectionBoundary>
      <SpaceView id={params.id} />
    </SectionBoundary>
  );
}
