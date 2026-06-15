import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { NewWorkContent } from "./content";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | New Work                                 |
 * | +--------------------------------------+ |
 * | | Type      [Book v]                   | |
 * | | Title     [_____________________]    | |
 * | | Orig.     [_____________________]    | |
 * | | Cover URL [_____________________]    | |
 * | | Date      [__________]              | |
 * | | (type-specific: ISBN, Pages, etc.)   | |
 * | | Website   [_____________________]    | |
 * | | NSFW      [x]                        | |
 * | | Description [PortableTextEditor]     | |
 * | | [Create]                             | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | New Work                                           |
 * | +------------------------------------------------+ |
 * | | Type [v]   Title [__________]                  | |
 * | |  ^--- grid-cols-2, fields side by side         | |
 * | | [Create]                                       | |
 * | +------------------------------------------------+ |
 * +----------------------------------------------------+
 *         w-full max-w-4xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     New Work                                               |
 * |     Same as Tablet, wider margins                          |
 * +------------------------------------------------------------+
 *           w-full max-w-4xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         New Work                                                     |
 * |         Same as Desktop, wider margins                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-4xl mx-auto
 *
 * max-w-4xl 居中容器。
 * 类型 Select 驱动条件字段：book → ISBN/Pages，movie → Runtime，
 * tv → Runtime/Seasons/Episodes，game → Platforms。
 * 表单字段 grid-cols-1 sm:grid-cols-2 窄端单列宽端双列。
 * 简介使用 PortableTextEditor。创建后跳转到作品详情页。
 * title 必填，其余可选。
 */
export default function NewWorkPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <NewWorkContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
