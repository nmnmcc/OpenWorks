import { SectionBoundary } from "@/components/SectionBoundary";
import { SearchContent } from "./content";

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | "Results for: query"        |
 * | [Posts|Works|Creators|...]  |
 * |  ^ TabsList max-w-full,     |
 * |    horizontal scroll        |
 * | N results                   |
 * | [PostCard / row Card]       |
 * | [PostCard / row Card]       |
 * |       [Load more]          |
 * +-----------------------------+
 * w-full, single column. Works
 * tab: 2-col WorkCard grid.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | "Results for: query"                 |
 * | [Posts][Works][Creators][Sp][Users]  |
 * | N results                            |
 * | [PostCard]  (works: 3-col grid)      |
 * |           [Load more]               |
 * +--------------------------------------+
 * max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | "Results for: query"                     |
 * | [Posts][Works][Creators][Spaces][Users]  |
 * | N results                                |
 * | [PostCard]  (works: 4-col grid)          |
 * |           [Load more]                    |
 * +------------------------------------------+
 * max-w-3xl centered.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      "Results for: query"                        |
 * |      [Posts][Works][Creators][Spaces][Users]     |
 * |      N results                                   |
 * |      [PostCard]  (works: 4-col grid)             |
 * |               [Load more]                        |
 * +--------------------------------------------------+
 * max-w-3xl (48rem) centered, symmetric mx-auto margins.
 *
 * 联邦搜索页：w-full max-w-3xl mx-auto 居中容器。nuqs 管理 ?q= 与 ?type=
 * （posts|works|creators|spaces|users，默认 posts）。分类 Tabs 切换结果
 * 类型；切换即重置分页（key={`${q}:${type}`} 重挂）。
 * 宽度处置：标题含用户输入查询串 wrap-anywhere；TabsList w-fit max-w-full
 * + overflow-x-auto（Mobile 横滑，永不换行/截断）；行卡片 = 头像/封面
 * shrink-0 + 名称 min-w-0 truncate + 徽章/计数 shrink-0（creators 徽章
 * ml-auto 吃右侧余宽）；Works 用 WorkCard 网格 2/3/4 列随断点变化。
 * 边界：q 为空 → 搜索提示 EmptyState；0 结果 → 空结果 EmptyState；
 *       分页 offset 追加，每页 PAGE_SIZE 条，末页满载显示"加载更多"。
 */
export default function SearchPage() {
  return (
    <SectionBoundary>
      <SearchContent />
    </SectionBoundary>
  );
}
