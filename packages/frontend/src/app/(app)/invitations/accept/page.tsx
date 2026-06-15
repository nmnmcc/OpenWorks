import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { AcceptInvitationContent } from "./content";

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 *          +-------------------------------+
 *          | Invitation                    |
 *          | Description                   |
 *          |                    [Accept]   |
 *          +-------------------------------+
 *
 * Card max-w-sm 居中（w-full max-w-sm mx-auto），py-12 外边距。
 * 所有视口下结构一致，无断点。宽度处置：窄端卡片收缩至视口宽（w-full），
 * 宽端 max-w-sm 封顶；[Accept] 为固定宽按钮右对齐（justify-end），
 * 留白落在行首；标题/描述文本自然折行。
 * 接受成功跳转至空间页。
 * 边界：token 为空 → EmptyState "无效邀请"。
 */
export default function AcceptInvitationPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <AcceptInvitationContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
