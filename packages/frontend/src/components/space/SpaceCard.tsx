"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale";
import type { Space } from "@openworks/backend/api";
import Link from "next/link";

interface SpaceCardProps {
  readonly space: Space;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +---------------------------------------------------+
 * | (Avatar)  Space Name [Private?] [NSFW?]           |
 * |  shrink-0 ^- wrap-anywhere -^   (flex-wrap)       |
 * |           Description text (truncate)...          |
 * |           42 members                              |
 * +---------------------------------------------------+
 *  ^ avatar  ^------- min-w-0 flex-1 ----------------^
 *
 * 卡片横向布局（flex-row items-center gap-3）：头像（size=lg，自带 shrink-0）
 * + 内容区（min-w-0 flex-1）。所有断点布局一致。
 * 窄端：名称行 flex-wrap 折行，名称 wrap-anywhere（超长无空格名照样断行），
 * badges 整体折到下一行；描述 truncate 单行截断。
 * 宽端：内容区 flex-1 吃满卡片余宽，卡片宽度由父级网格/列封顶。
 * 边界：description 为 null → 不渲染描述行。
 */
export function SpaceCard({ space }: SpaceCardProps) {
  const [t] = useT();

  return (
    <Card className="flex-row items-center gap-3 p-3 [--space:--spacing(3)]">
      <Avatar size="lg">
        <AvatarImage alt={space.name} src={space.icon ?? undefined} />
        <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link className="font-semibold wrap-anywhere hover:underline" href={`/spaces/${space.id}`}>
            {space.name}
          </Link>
          {space.visibility === "private" && <Badge variant="outline">{t.spaces.visibilityPrivate}</Badge>}
          {space.visibility === "restricted" && <Badge variant="outline">{t.spaces.visibilityRestricted}</Badge>}
          {space.nsfw && <Badge variant="destructive">{t.post.nsfw}</Badge>}
        </div>
        {space.description !== null && <p className="text-muted-foreground truncate text-sm">{space.description}</p>}
        <p className="text-muted-foreground text-xs">{t.spaces.members(space.memberCount)}</p>
      </div>
    </Card>
  );
}
