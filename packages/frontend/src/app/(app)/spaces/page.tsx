"use client";

import { spacesPageQuery } from "@/atoms/spaces";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { CreateSpaceDialog } from "@/components/space/CreateSpaceDialog";
import { SpaceCard } from "@/components/space/SpaceCard";
import { useT } from "@/lib/i18n/locale";
import { UsersIcon } from "lucide-react";

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

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Spaces                    [+ Create]     |
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
 * | +--------------------------------------------+ |
 * | | [SpaceCard]                                | |
 * | +--------------------------------------------+ |
 * | | [SpaceCard]                                | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Spaces                          [+ Create]     |
 * |       +--------------------------------------------+ |
 * |       | [SpaceCard]                                | |
 * |       +--------------------------------------------+ |
 * |       | [SpaceCard]                                | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Spaces                          [+ Create]          |
 * |            +--------------------------------------------+      |
 * |            | [SpaceCard]                                |      |
 * |            +--------------------------------------------+      |
 * |            | [SpaceCard]                                |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 标题行宽度处置：h1 与 [+ Create] 均为固定短标签（按钮自带 shrink-0），
 * justify-between 推开两端，320px 下两者合计仍小于行宽；宽端留白落在中间。
 * SpaceCard 列表 flex-col gap-3 竖向堆叠（卡片内部窄宽处置见 SpaceCard）。
 * 边界：0 个空间 → EmptyState（用户组图标）。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function SpacesPage() {
  const [t] = useT();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.spaces.title}</h1>
        <CreateSpaceDialog />
      </div>
      <SectionBoundary>
        <SpaceList />
      </SectionBoundary>
    </div>
  );
}
