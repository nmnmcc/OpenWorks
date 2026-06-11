"use client";

import { creatorQuery, creatorWorksQuery } from "@/atoms/creators";
import { SectionBoundary } from "@/components/SectionBoundary";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function CreatorHeader({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(creatorQuery(id));
  const creator = result.value;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar className="size-24 shrink-0 text-2xl sm:size-32" size="lg">
        <AvatarImage alt={creator.name} src={creator.imageUrl ?? undefined} />
        <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold wrap-anywhere">{creator.name}</h1>
          <Badge variant="secondary">{creator.kind === "person" ? t.library.person : t.library.organization}</Badge>
        </div>
        {creator.bio && <PortableTextView value={creator.bio} />}
        <Button asChild className="self-start" size="sm" variant="outline">
          <Link href={`/library/creators/${id}/edit`}>
            <PencilIcon className="size-4" />
            {t.common.edit}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CreatorWorks({ id }: { readonly id: string }) {
  const [t] = useT();
  const result = useAtomSuspense(creatorWorksQuery(id));

  if (result.value.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.common.noResults}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {result.value.map((entry) => (
        <Card className="flex items-center gap-3 p-3" key={entry.work.id}>
          <Link className="min-w-0 flex-1 text-sm font-medium hover:underline" href={`/library/works/${entry.work.id}`}>
            {entry.work.title}
          </Link>
          <div className="flex shrink-0 flex-wrap gap-1">
            {entry.roles.map((role: string) => (
              <Badge key={role} variant="outline">
                {t.library.role[role as keyof typeof t.library.role] ?? role}
              </Badge>
            ))}
          </div>
          {entry.work.releaseDate && (
            <span className="text-muted-foreground shrink-0 text-xs">
              {new Date(entry.work.releaseDate).getFullYear()}
            </span>
          )}
        </Card>
      ))}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | (Avatar size-24)                         |
 * | Creator Name [Person]                    |
 * |  ^wrap-anywhere   ^shrink-0              |
 * | Bio text (PortableTextView)              |
 * | [Edit]                                   |
 * |                                          |
 * | Works                                    |
 * | +--------------------------------------+ |
 * | | Work Title........     [Author] 2020 | |
 * | | ^flex-1 truncate    ^shrink-0 ^shrink-0|
 * | +--------------------------------------+ |
 * | +--------------------------------------+ |
 * | | Another Work           [Writer] 2019 | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | (Avatar sm:size-32) Creator Name [Person]          |
 * |                     Bio text                       |
 * |                     [Edit]                         |
 * | ^--- sm:flex-row, avatar + info side by side ---^  |
 * |                                                    |
 * | Works                                              |
 * | [work cards -- same as mobile]                     |
 * +----------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Same as Tablet, wider margins                          |
 * +------------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Same as Desktop, wider margins                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-3xl mx-auto
 *
 * max-w-3xl 居中容器。
 * 头部：< sm 垂直堆叠（头像 + 信息），>= sm 水平排列（头像 shrink-0 + 信息
 * flex-1 min-w-0）。名称 wrap-anywhere，类别徽章 shrink-0。
 * 年表：Card 列表，每行 = 标题(flex-1 min-w-0 truncate) + 角色徽章(shrink-0
 * flex-wrap) + 年份(shrink-0)。
 * 边界：bio null → 不渲染。0 作品 → 空提示。无头像 → AvatarFallback。
 */
export default function CreatorPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionBoundary>
        <CreatorHeader id={params.id} />
      </SectionBoundary>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.creators}</h2>
        <SectionBoundary>
          <CreatorWorks id={params.id} />
        </SectionBoundary>
      </section>
    </div>
  );
}
