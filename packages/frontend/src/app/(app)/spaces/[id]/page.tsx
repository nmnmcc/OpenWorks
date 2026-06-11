"use client";

import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import { spaceQuery } from "@/atoms/spaces";
import { PostFeed } from "@/components/post/PostFeed";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { JoinButton } from "@/components/space/JoinButton";
import { SpaceSidebar } from "@/components/space/SpaceSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { Cause } from "effect";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { LockIcon, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

type SortKind = "hot" | "new" | "top";

function parseSort(value: string): SortKind {
  return value === "new" ? "new" : value === "top" ? "top" : "hot";
}

function isTaggedError(error: unknown, tag: string): boolean {
  return typeof error === "object" && error !== null && "_tag" in error && error._tag === tag;
}

function SpaceView({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(spaceQuery(id), { includeFailure: true });
  const setPostComposeDialog = useAtomSet(postComposeDialogAtom);
  const [sort, setSort] = useState<SortKind>("hot");

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
          <p className="text-muted-foreground truncate text-sm">
            {space.slug} · {t.spaces.members(space.memberCount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setPostComposeDialog({ open: true, spaceId: space.id })} variant="outline">
            <PlusIcon />
            {t.spaces.createPostHere}
          </Button>
          <JoinButton spaceId={space.id} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex justify-end">
            <SimpleSelect
              ariaLabel={t.feed.hot}
              className="w-32"
              items={[
                { value: "hot", label: t.feed.hot },
                { value: "new", label: t.feed.new },
                { value: "top", label: t.feed.top },
              ]}
              onChange={(value) => setSort(parseSort(value))}
              value={sort}
            />
          </div>
          <PostFeed spaceId={space.id} key={sort} sort={sort} />
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
 * |          slug · 42 members               |
 * | [+ New Post] [Join/Leave]                |
 * |------------------------------------------|
 * | [Sort: v Hot]                            |
 * | [PostCard]                               |
 * | [PostCard]                               |
 * |------------------------------------------|
 * | [SpaceSidebar]                           |
 * +------------------------------------------+
 *            w-full (fills parent)
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]         |
 * | (Avatar) Space Name [NSFW?]                    |
 * |          slug · 42 members                     |
 * |                    [+ New Post] [Join/Leave]    |
 * |------------------------------------------------|
 * | [Sort: v Hot]                                  |
 * | [PostCard]                                     |
 * | [PostCard]                                     |
 * |------------------------------------------------|
 * | [SpaceSidebar]                                 |
 * +------------------------------------------------+
 *            w-full (fills parent)
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]               |
 * | (Avatar) Space Name [NSFW?]                          |
 * |          slug · 42 members                           |
 * |                      [+ New Post] [Join/Leave]       |
 * +------------------------------------------------------+
 * | [Sort: v Hot]                 | SpaceSidebar (18rem) |
 * | [PostCard]                    | Description          |
 * | [PostCard]                    | 42 members           |
 * |                               | Rules (accordion)    |
 * | (1fr)                         | [Wiki] [Mod Tools]   |
 * +-------------------------------+----------------------+
 *    lg:grid-cols-[1fr_18rem] gap-4
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * | [Banner sm:h-44 -- rounded-xl, border]                         |
 * | (Avatar) Space Name [NSFW?]                                    |
 * |          slug · 42 members                                     |
 * |                              [+ New Post] [Join/Leave]         |
 * +----------------------------------------------------------------+
 * | [Sort: v Hot]                         | SpaceSidebar (18rem)   |
 * | [PostCard]                            | Description            |
 * | [PostCard]                            | 42 members             |
 * |                                       | Rules (accordion)      |
 * | (1fr)                                 | [Wiki] [Mod Tools]     |
 * +---------------------------------------+------------------------+
 *    lg:grid-cols-[1fr_18rem] gap-4
 *
 * 无 max-w 包裹，填充父级宽度。banner 有条件渲染，<640px 时 h-32，>=640px 时 sm:h-44。
 * 头行宽度处置：头像自带 shrink-0；中间块 min-w-0 flex-1（吃掉余宽），
 * 名称 wrap-anywhere（超长无空格名断行）、slug·members 行 truncate；
 * 按钮组为固定宽（按钮自带 shrink-0），窄端整组经外层 flex-wrap 折到下一行
 * （Mobile 草图第三行即此状态）。宽端：中间块伸展，按钮组贴右。
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
