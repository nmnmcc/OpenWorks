import { SectionBoundary } from "@/components/SectionBoundary";
import { MyLibraryContent } from "./content";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | My Library              [Status v]       |
 * |  ^min-w-0 truncate        ^shrink-0 w-32 |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | [Stat] | [Stat] |                       |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | My Library                        [Status v]       |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | |Title | |Title | |Title |                        |
 * | [Stat] | [Stat] | [Stat] |                        |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     My Library                          [Status v]         |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     |Title | |Title | |Title | |Title |                   |
 * |     [Stat] | [Stat] | [Stat] | [Stat] |                   |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         My Library                              [Status v]           |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         |Title | |Title | |Title | |Title | |Title |               |
 * |         [Stat] | [Stat] | [Stat] | [Stat] | [Stat] |               |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl 居中容器。标题行 justify-between，h1 与 status select
 * 分居两端；h1 min-w-0 truncate，select shrink-0 w-32。
 * 每卡下方嵌 LibraryStatusControl（w-full 等宽于卡片）。
 * 网格 2/3/4/5 列（sm/lg/2xl 断点），PagedList 分页。
 * 边界：0 个条目 → EmptyState。状态筛选 all = 不筛选。
 */
export default function MyLibraryPage() {
  return (
    <SectionBoundary>
      <MyLibraryContent />
    </SectionBoundary>
  );
}
