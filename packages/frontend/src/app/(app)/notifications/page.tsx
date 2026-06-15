import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { NotificationsContent } from "./content";

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | Notifications  [Mark all]   |
 * |-----------------------------|
 * | [*] Title (bold)    3h ago  |
 * |     Body text               |
 * |-----------------------------|
 * |     Title (read)    1d ago  |
 * +-----------------------------+
 * w-full, single column. Notification
 * cards fill available width.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | Notifications       [Mark all read]  |
 * |--------------------------------------|
 * | [*] Title (bold if unread)   3h ago  |
 * |     Body text                        |
 * |--------------------------------------|
 * |     Title (read)             1d ago  |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | Notifications         [Mark all read]    |
 * |------------------------------------------|
 * | [*] Title (bold if unread)    3h ago     |
 * |     Body text                            |
 * |------------------------------------------|
 * |     Title (read)              1d ago     |
 * +------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      Notifications         [Mark all read]       |
 * |--------------------------------------------------|
 * |      [*] Title (bold if unread)       3h ago     |
 * |          Body text                               |
 * |--------------------------------------------------|
 * |          Title (read)                 1d ago     |
 * +--------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。无响应式断点——所有尺寸结构一致。
 * 行内宽度处置：通知行 = 蓝点（shrink-0）+ 内容（min-w-0 flex-1，标题/正文
 * 自然折行，超长无空格词由 wrap-anywhere 断行）+ 时间（shrink-0）；标题行
 * h1 与 [Mark all read] 均为固定短标签（按钮自带 shrink-0），justify-between
 * 推开两端，320px 下两者合计仍小于行宽。
 * 未读通知：左侧蓝点（bg-info）+ 蓝色边框/背景（border-info/48 bg-info/4）+ 粗体标题。
 * 点击通知：标记已读并跳转 linkUrl。
 * 边界：0 条通知 -> EmptyState。
 *       linkUrl 为 null -> 仅标记已读，不跳转。
 *       body 为 null -> 不显示正文行。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function NotificationsPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <NotificationsContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
