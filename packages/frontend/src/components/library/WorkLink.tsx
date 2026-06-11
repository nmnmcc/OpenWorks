"use client";

import { Badge } from "@/components/ui/badge";
import type { Post } from "@openworks/backend/api";
import { BookOpenIcon, FilmIcon, GamepadIcon, TvIcon } from "lucide-react";
import Link from "next/link";

const typeIcon: Record<string, typeof BookOpenIcon> = {
  book: BookOpenIcon,
  movie: FilmIcon,
  tv: TvIcon,
  game: GamepadIcon,
};

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +------------------------------------------+
 * | [icon] Work Title...              [type] |
 * |  ^shrink-0  ^min-w-0+truncate  ^shrink-0 |
 * +------------------------------------------+
 *  inline badge linked to /library/works/:id
 */
export function WorkLink({ post }: { readonly post: Post }) {
  if (!post.workId) return null;

  const Icon = typeIcon[post.type === "review" ? "book" : "book"] ?? BookOpenIcon;

  return (
    <Link href={`/library/works/${post.workId}`}>
      <Badge className="inline-flex max-w-48 items-center gap-1" variant="outline">
        <Icon className="size-3 shrink-0" />
        <span className="min-w-0 truncate">{post.title}</span>
      </Badge>
    </Link>
  );
}
