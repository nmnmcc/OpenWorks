import { SectionBoundary } from "@/components/SectionBoundary";
import { LibraryBrowseContent } from "./content";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Library                       [+ New]    |
 * | [All][Book][Movie][TV][Game]             |
 * |  ^------- TabsList scroll-x --------^    |
 * | [Sort v] [Search________________] [Q]   |
 * |  ^shrink-0  ^flex-1 min-w-0   ^shrink-0  |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Library                             [+ New]        |
 * | [All] [Book] [Movie] [TV] [Game]                   |
 * | [Sort v] [Search________________________] [Q]      |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | |Title | |Title | |Title |                        |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Library                                 [+ New]        |
 * |     [All] [Book] [Movie] [TV] [Game]                       |
 * |     [Sort v] [Search_________________________] [Q]         |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     |Title | |Title | |Title | |Title |                   |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Library                                      [+ New]         |
 * |         [All] [Book] [Movie] [TV] [Game]                             |
 * |         [Sort v] [Search______________________________] [Q]          |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         |Title | |Title | |Title | |Title | |Title |               |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl (64rem) 居中容器。类型 Tabs 控制 type 筛选，排序 Select 控制
 * sort（popular/new/top），搜索框走 Meilisearch 全文搜索。
 * WorkCard 网格 2/3/4/5 列（sm/lg/2xl 断点）。PagedList 分页。
 * 标题行：h1 与 [+ New] 均为固定短标签（按钮 shrink-0），justify-between
 * 推开两端，320px 下两者合计仍小于行宽；宽端留白落在中间。
 * 筛选行：Sort select shrink-0 w-28，搜索框 flex-1 min-w-0，搜索按钮
 * shrink-0；320px 下输入框收缩截断，控件不溢出。
 * q 非空时切换到搜索结果模式（独立分页逻辑），清空 q 回到浏览模式。
 * 边界：0 个作品 → EmptyState。搜索 0 结果 → EmptyState。
 */
export default function LibraryBrowsePage() {
  return (
    <SectionBoundary>
      <LibraryBrowseContent />
    </SectionBoundary>
  );
}
