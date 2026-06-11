"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { BookOpenIcon, FilmIcon, GamepadIcon, TvIcon } from "lucide-react";
import Link from "next/link";

const typeIcon: Record<string, typeof BookOpenIcon> = {
  book: BookOpenIcon,
  movie: FilmIcon,
  tv: TvIcon,
  game: GamepadIcon,
};

interface WorkCardProps {
  readonly work: {
    readonly id: string;
    readonly title: string;
    readonly type: string;
    readonly coverUrl: string | null;
    readonly releaseDate: string | Date | null;
    readonly ratingCount: number;
    readonly ratingSum: number;
  };
  readonly className?: string;
}

/**
 * Mobile (<640px) / Tablet (640-1023px) / Desktop (1024-1535px) / Ultra-wide (>=1536px):
 *
 * +------------------+
 * |                  |  <- cover 2:3 aspect ratio, bg-muted fallback
 * |    [cover img]   |     or centered type icon when no coverUrl
 * |                  |
 * +------------------+
 * | Title..........  |  <- min-w-0 truncate, 2 lines clamp
 * | 2010 · [Book]    |  <- year + type badge, flex-wrap
 * | ★ 8.4            |  <- average rating badge (only if ratingCount > 0)
 * +------------------+
 *  grid item, w-full
 *
 * Grid columns: 2 (mobile) / 3 (tablet) / 4 (desktop) / 5 (ultra-wide)
 * managed by parent grid container.
 */
export function WorkCard({ work, className }: WorkCardProps) {
  const [t] = useT();
  const Icon = typeIcon[work.type] ?? BookOpenIcon;
  const year = work.releaseDate ? new Date(work.releaseDate).getFullYear() : null;
  const average = work.ratingCount > 0 ? (work.ratingSum / work.ratingCount).toFixed(1) : null;
  const typeLabel = t.library.type[work.type as keyof typeof t.library.type] ?? work.type;

  return (
    <Link className={cn("group", className)} href={`/library/works/${work.id}`}>
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="bg-muted flex aspect-2/3 items-center justify-center overflow-hidden">
          {work.coverUrl ? (
            <img alt={work.title} className="size-full object-cover" src={work.coverUrl} />
          ) : (
            <Icon className="text-muted-foreground size-12" />
          )}
        </div>
        <div className="flex flex-col gap-1 p-2">
          <span className="line-clamp-2 min-w-0 text-sm font-medium">{work.title}</span>
          <div className="flex flex-wrap items-center gap-1">
            {year && <span className="text-muted-foreground text-xs">{year}</span>}
            <Badge className="text-xs" variant="secondary">{typeLabel}</Badge>
          </div>
          {average && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span className="text-yellow-500">★</span>
              <span>{average}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
