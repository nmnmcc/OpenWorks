import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { MessagesContent } from "./content";

/**
 * Mobile (<640px):
 * +-------------------------------+
 * | Messages          [Compose]   |
 * | [Inbox | Sent]                |
 * |-------------------------------|
 * | [*] From user                 |
 * |     Subject text...   3h ago  |
 * |     (click to expand)         |
 * |   +-------------------------+ |
 * |   | Message body   [Delete] | |
 * |   +-------------------------+ |
 * |-------------------------------|
 * |     To user                   |
 * |     Subject text...   1d ago  |
 * +-------------------------------+
 * From/To label and Subject stack vertically
 * (flex-col) on mobile. w-full fills viewport.
 *
 * Tablet (640-1023px):
 * +-------------------------------------------+
 * | Messages                    [Compose]     |
 * | [Inbox | Sent]                            |
 * |-------------------------------------------|
 * | [*] From user  Subject text...    3h ago  |
 * |     (click to expand)                     |
 * |   +-------------------------------------+ |
 * |   | Message body          [Delete]      | |
 * |   +-------------------------------------+ |
 * |-------------------------------------------|
 * |     To user    Subject text...    1d ago  |
 * +-------------------------------------------+
 * sm:flex-row kicks in -- From/To and Subject
 * sit on one line. max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +----------------------------------------------+
 * | Messages                     [Compose]       |
 * | [Inbox | Sent]                               |
 * |----------------------------------------------|
 * | [*] From user  Subject text...    3h ago     |
 * |     (click to expand)                        |
 * |   +----------------------------------------+ |
 * |   | Message body          [Delete]         | |
 * |   +----------------------------------------+ |
 * |----------------------------------------------|
 * |     To user    Subject text...    1d ago     |
 * +----------------------------------------------+
 * same structure as Tablet -- max-w-3xl centered
 * with wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------------+
 * |      Messages                     [Compose]            |
 * |      [Inbox | Sent]                                    |
 * |--------------------------------------------------------|
 * |      [*] From user  Subject text...        3h ago      |
 * |          (click to expand)                             |
 * |        +--------------------------------------------+  |
 * |        | Message body               [Delete]        |  |
 * |        +--------------------------------------------+  |
 * |--------------------------------------------------------|
 * |          To user    Subject text...        1d ago      |
 * +--------------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。Tabs 切换 inbox/sent。
 * 消息行用 Collapsible 展开正文；展开 inbox 未读消息自动标记已读。
 * 关键响应式断点：消息行中 from/subject 使用
 * `flex-col sm:flex-row sm:items-center sm:gap-2`，
 * sm 以下竖排堆叠，sm 及以上单行并排。
 * 行内宽度处置：未读点/时间 shrink-0；发件人组 shrink-0 但用户名被
 * max-w-40 + truncate 封顶（超长名截断为省略号）；subject truncate
 * 吃掉行内余宽并截断。标题行：h1 与 [Compose] 均固定宽，justify-between
 * 推开两端。展开正文行：正文 min-w-0 flex-1（吃满余宽、超长词由
 * wrap-anywhere 断行），删除按钮 shrink-0。
 * 边界：0 条消息 -> EmptyState（inbox/sent 各自独立）。
 *       未读消息：蓝点（bg-info）+ 粗体 subject。
 *       删除消息弹出 ConfirmDialog 确认。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function MessagesPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <MessagesContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
