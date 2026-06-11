"use client";

import { WorkLink } from "@/components/library/WorkLink";
import { FlairBadge } from "@/components/post/FlairBadge";
import { PostActionsMenu } from "@/components/post/PostActionsMenu";
import { VoteButtons } from "@/components/post/VoteButtons";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { SpaceLink } from "@/components/shared/SpaceLink";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { Post } from "@openworks/backend/api";
import { Match } from "effect";
import { ExternalLinkIcon, LockIcon, MessageSquareIcon, PinIcon, Share2Icon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface PostCardProps {
  readonly post: Post;
  readonly detail?: boolean;
  readonly onEdit?: () => void;
  readonly onDeleted?: () => void;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * List mode (detail=false):
 * +---------------------------------------------------+
 * | [^]  Title [Flair] [Pinned] [NSFW]                |
 * | 42   space · by author · 3h ago                   |
 * | [v]  [Comments 5] [Share] [...]                   |
 * +---------------------------------------------------+
 *
 * Detail mode (detail=true):
 * +---------------------------------------------------+
 * | [^]  Title (h1)  [badges...]                      |
 * | 42   space · by author · 3h ago (edited)          |
 * | [v]  link-hostname / image / body (PortableText)  |
 * |      Comments 5  [Share] [...]                    |
 * +---------------------------------------------------+
 *
 * Width handling (all rows):
 * +---------------------------------------------------+
 * | [^]  Title [Flair] [Pinned]          (flex-wrap)  |
 * | 42   space.. · by author.. · 3h ago  (flex-wrap)  |
 * | [v]  hostname..............[ext]     (truncate)   |
 * |      [Comments 5] [Share] [...]      (flex-wrap)  |
 * +---------------------------------------------------+
 *  fixed ^-------------- min-w-0 flex-1 -------------^
 *
 * 卡片 = 投票列（固定内容宽）+ 内容区（min-w-0 flex-1），所有断点布局一致。
 * 窄端：标题行 flex-wrap 折行，标题 wrap-anywhere（超长无空格词照样断行）；
 * meta 行 flex-wrap，space/author 链接 truncate（单个超长名截断为省略号）；
 * hostname 行 truncate，外链图标 shrink-0；底部按钮行 flex-wrap（按钮自带
 * shrink-0 不收缩，320px 深窄容器下折行而非溢出）。
 * 宽端：内容区 flex-1 吃满卡片余宽，卡片宽度由父级 feed 列封顶（无内部 max-w）；
 * 各行内容保持自身宽度，留白落在行尾。
 * 边界：已移除帖子 → 正文替换为斜体提示。
 *       剧透 → 内容隐藏，需点击按钮展开。
 *       长标题自然折行。无图片 → 不渲染 img。
 *       spaceId 为 null → 空间链接和分隔点隐藏。
 */
export function PostCard({ post, detail = false, onEdit, onDeleted }: PostCardProps) {
  const [t] = useT();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const isEdited = post.updatedAt.getTime() > post.createdAt.getTime();
  const isBodyHidden = post.spoiler && !spoilerRevealed && !post.removed;

  const title = Match.value(detail).pipe(
    Match.when(true, () => <h1 className="text-lg leading-snug font-semibold wrap-anywhere">{post.title}</h1>),
    Match.orElse(() => (
      <Link className="leading-snug font-semibold wrap-anywhere hover:underline" href={`/posts/${post.id}`}>
        {post.title}
      </Link>
    )),
  );

  return (
    <Card className="flex-row gap-2 p-3 [--space:--spacing(3)]">
      <VoteButtons kind="post" score={post.score} targetId={post.id} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {title}
          {post.spaceId !== null && post.flairId !== null && (
            <FlairBadge flairId={post.flairId} spaceId={post.spaceId} />
          )}
          {post.pinned && (
            <Badge variant="info">
              <PinIcon /> {t.post.pinned}
            </Badge>
          )}
          {post.locked && (
            <Badge variant="warning">
              <LockIcon /> {t.post.locked}
            </Badge>
          )}
          {post.type === "review" && (
            <Badge variant="secondary">
              <StarIcon className="size-3" /> {t.library.reviews}
            </Badge>
          )}
          {post.nsfw && <Badge variant="destructive">{t.post.nsfw}</Badge>}
          {post.spoiler && <Badge variant="outline">{t.post.spoiler}</Badge>}
          {post.removed && <Badge variant="destructive">{t.post.removed}</Badge>}
          {post.workId && <WorkLink post={post} />}
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          {post.spaceId !== null && (
            <>
              <SpaceLink className="text-foreground truncate" id={post.spaceId} />
              <span aria-hidden>·</span>
            </>
          )}
          <span>{t.post.by}</span>
          <UserLink className="truncate" id={post.authorId} />
          <span aria-hidden>·</span>
          <TimeAgo date={post.createdAt} />
          {isEdited && <span className="italic">({t.common.edited})</span>}
        </div>

        {(post.type === "link" || post.type === "image") && post.url !== null && (
          <a
            className="text-info-foreground flex items-center gap-1 text-sm hover:underline"
            href={post.url}
            rel="noreferrer noopener"
            target="_blank"
          >
            <span className="truncate">{safeHostname(post.url)}</span>
            <ExternalLinkIcon className="size-3.5 shrink-0" />
          </a>
        )}

        {detail && post.removed && <p className="text-muted-foreground text-sm italic">{t.post.removedBody}</p>}

        {detail && !post.removed && isBodyHidden && (post.content !== null || post.url !== null) && (
          <Button className="self-start" onClick={() => setSpoilerRevealed(true)} size="sm" variant="secondary">
            {t.post.showSpoiler}
          </Button>
        )}

        {detail && !post.removed && !isBodyHidden && (
          <>
            {post.type === "image" && post.url !== null && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={post.title} className="max-h-[32rem] w-fit rounded-lg border object-contain" src={post.url} />
            )}
            {post.content !== null && <PortableTextView className="mt-1" value={post.content} />}
          </>
        )}

        <div className={cn("text-muted-foreground flex flex-wrap items-center gap-1", detail ? "mt-1" : "mt-0.5")}>
          {Match.value(detail).pipe(
            Match.when(true, () => (
              <span className="flex items-center gap-1 text-xs">
                <MessageSquareIcon className="size-3.5" />
                {t.post.commentCount(post.commentCount)}
              </span>
            )),
            Match.orElse(() => (
              <Button asChild size="xs" variant="ghost">
                <Link href={`/posts/${post.id}`}>
                  <MessageSquareIcon />
                  {t.post.commentCount(post.commentCount)}
                </Link>
              </Button>
            )),
          )}
          <Button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
              toast.success({ title: t.common.copied });
            }}
            size="xs"
            variant="ghost"
          >
            <Share2Icon />
            {t.post.shareAction}
          </Button>
          <PostActionsMenu onDeleted={onDeleted} onEdit={onEdit} post={post} />
        </div>
      </div>
    </Card>
  );
}
