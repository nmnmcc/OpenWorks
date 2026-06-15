import { SectionBoundary } from "@/components/SectionBoundary";
import { ShelvesContent } from "./content";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Shelves                       [+ New]    |
 * | [My Shelves] [Public Shelves]            |
 * |  ^--- TabsList ---^                      |
 * | +--------------------------------------+ |
 * | | [bk] My Favorites    12 items       | |
 * | | ^shrink-0 ^flex-1 truncate ^shrink-0 | |
 * | +--------------------------------------+ |
 * | | [bk] Reading List     5 items       | |
 * | +--------------------------------------+ |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Shelves                            [+ New]         |
 * | [My Shelves] [Public Shelves]                      |
 * | [shelf cards -- same as mobile]                    |
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
 * max-w-3xl 居中容器。Tabs 切换"我的书架"/"公开书架"。
 * 标题行 justify-between，h1 与 [+ New] 均为固定短标签。
 * 书架 Card 列表：图标(shrink-0) + 名称(flex-1 truncate) + 条目数(shrink-0)。
 * 新建书架通过 Dialog 弹窗。
 * 边界：0 个书架 → EmptyState。私有书架显示"Private"标签。
 *       ?ownerId=<他人 id>（nuqs）→ 隐藏 Tabs，直接列该用户的公开书架
 *       （后端按可见性过滤）；ownerId 为自己或缺省 → 正常 Tabs 模式。
 */
export default function ShelvesPage() {
  return (
    <SectionBoundary>
      <ShelvesContent />
    </SectionBoundary>
  );
}
