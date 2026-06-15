import { SectionBoundary } from "@/components/SectionBoundary";
import { HomeContent } from "./content";

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | [Home|All]   [Sort: v Hot]  |
 * |  ^tabs        ^w-32 shrink-0|
 * |-----------------------------|
 * | [PostCard] x4               |
 * | [New works  ->  carousel]   |
 * | [PostCard] x6               |
 * | [Popular works -> carousel] |
 * |       [Load more]          |
 * +-----------------------------+
 * w-full, same structure. 320px: sort select
 * keeps w-32 (shrink-0); tabs list is the
 * shrinking item (max-w-full overflow-x-auto,
 * scrolls instead of clipping).
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | [Home | All]          [Sort: v Hot]  |
 * |--------------------------------------|
 * | [PostCard]                           |
 * | [PostCard]                           |
 * | [PostCard]                           |
 * |           [Load more]               |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered,
 * comfortable spacing in top bar.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | [Home | All]              [Sort: v Hot]  |
 * |------------------------------------------|
 * | [PostCard]                               |
 * | [PostCard]                               |
 * | [PostCard]                               |
 * |           [Load more]                    |
 * +------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margin on both sides.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      [Home | All]              [Sort: v Hot]      |
 * |--------------------------------------------------|
 * |      [PostCard]                                   |
 * |      [PostCard]                                   |
 * |      [PostCard]                                   |
 * |               [Load more]                         |
 * +--------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。顶部栏：左侧 Tabs 切换
 * feed（home/all），右侧 SimpleSelect 切换排序（hot/new/top）。
 * 顶栏宽度处置：窄端排序选择器 w-32 shrink-0 不压缩，tabs 列表
 * max-w-full + overflow-x-auto 收缩（必要时内部横滚）；宽端
 * justify-between 把两端推开，余宽落在中间。
 * 顶栏控件等高：选择器 h-9 sm:h-8 与 TabsTrigger（h-9 sm:h-8）一致。
 * feed/sort 变化时通过 key 重建 PostFeed。
 * withWorkCarousels：第 4 张帖子卡后插"最新作品"横滚轮播，此后每 6 张
 * 交替"热门/最新"（节奏常量在 PostFeed；轮播空数据时整行不渲染）。
 * 无响应式断点——所有尺寸结构一致。
 * 边界：空 feed -> PostFeed 内部处理空态（无轮播）。
 */
export default function HomePage() {
  return (
    <SectionBoundary>
      <HomeContent />
    </SectionBoundary>
  );
}
