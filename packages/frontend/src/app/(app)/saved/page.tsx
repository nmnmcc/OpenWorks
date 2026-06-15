import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { SavedContent } from "./content";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Saved                                    |
 * | +--------------------------------------+ |
 * | | [Post] Title...   3h ago [Unsave]    | |
 * | |  ^min-w-0 flex-1   ^--- shrink-0 ---^ | |
 * | |   title truncate / comment clamp-2   | |
 * | +--------------------------------------+ |
 * | | [Comment] Text... 1d ago [Unsave]    | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Saved                                          |
 * | +--------------------------------------------+ |
 * | | [Post] Post title...       3h ago [Unsave] | |
 * | +--------------------------------------------+ |
 * | | [Comment] Comment text...  1d ago [Unsave] | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Saved                                          |
 * |       +--------------------------------------------+ |
 * |       | [Post] Post title...       3h ago [Unsave] | |
 * |       +--------------------------------------------+ |
 * |       | [Comment] Comment text...  1d ago [Unsave] | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Saved                                               |
 * |            +--------------------------------------------+      |
 * |            | [Post] Post title...       3h ago [Unsave] |      |
 * |            +--------------------------------------------+      |
 * |            | [Comment] Comment text...  1d ago [Unsave] |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 每项 Card 始终为 flex-row 横向布局：左侧内容 (min-w-0 flex-1) + 右侧时间与操作 (shrink-0)。
 * Post 与 Comment 通过 Badge 标签区分，Comment 内容 line-clamp-2 截断。
 * 边界：0 项 → EmptyState（书签图标）。
 *       帖子/评论异步加载，未就绪时显示 Skeleton。
 *       超长标题通过 truncate 截断；极窄视口 (320px) 下标题与按钮仍为同行。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function SavedPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <SavedContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
