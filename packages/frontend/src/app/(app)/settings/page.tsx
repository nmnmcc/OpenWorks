import { ClientOnly } from "@/components/ClientOnly";
import { SectionBoundary } from "@/components/SectionBoundary";
import { SettingsContent } from "./content";

/**
 * Mobile (<640px):
 * +-----------------------------------+
 * | Settings                          |
 * | +-------------------------------+ |
 * | | Profile                       | |
 * | | Display Name [input]          | |
 * | | Bio          [textarea]       | |
 * | | Avatar [ImageUpload]          | |
 * | | Banner [ImageUpload]          | |
 * | |                      [Save]   | |
 * | +-------------------------------+ |
 * | +-------------------------------+ |
 * | | Language                      | |
 * | | [Select]                      | |
 * | +-------------------------------+ |
 * +-----------------------------------+
 *            w-full
 *
 * Tablet (640-1023px):
 * +---------------------------------------+
 * | Settings                              |
 * | +-----------------------------------+ |
 * | | Profile                           | |
 * | | Display Name [input]              | |
 * | | Bio          [textarea]           | |
 * | | Avatar [Upload] | Banner [Upload] | |
 * | |                          [Save]   | |
 * | +-----------------------------------+ |
 * | +-----------------------------------+ |
 * | | Language                          | |
 * | | [Select]                          | |
 * | +-----------------------------------+ |
 * +---------------------------------------+
 *       w-full max-w-2xl mx-auto
 *
 * Desktop (1024-1535px):
 * +--------------------------------------------+
 * |     Settings                               |
 * |     +------------------------------------+ |
 * |     | Profile                            | |
 * |     | Display Name [input]               | |
 * |     | Bio          [textarea]            | |
 * |     | Avatar [Upload] | Banner [Upload]  | |
 * |     |                           [Save]   | |
 * |     +------------------------------------+ |
 * |     +------------------------------------+ |
 * |     | Language                           | |
 * |     | [Select]                           | |
 * |     +------------------------------------+ |
 * +--------------------------------------------+
 *       w-full max-w-2xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------+
 * |          Settings                                        |
 * |          +------------------------------------+          |
 * |          | Profile                            |          |
 * |          | Display Name [input]               |          |
 * |          | Bio          [textarea]            |          |
 * |          | Avatar [Upload] | Banner [Upload]  |          |
 * |          |                           [Save]   |          |
 * |          +------------------------------------+          |
 * |          +------------------------------------+          |
 * |          | Language                           |          |
 * |          | [Select]                           |          |
 * |          +------------------------------------+          |
 * +----------------------------------------------------------+
 *             w-full max-w-2xl mx-auto
 *
 * max-w-2xl (42rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 行内宽度处置：表单控件均独占一行（w-full）；图片上传区 sm (>=640px) 以上
 * grid-cols-2 双列（每格各占 50% 减 gap，上传区/预览图随格宽收缩），<640px
 * 单列堆叠；[Save] 行为固定宽按钮右对齐（justify-end），留白落在行首。
 * 边界：所有输入字段拉满容器宽度；极窄视口 (320px) 下图片上传区单列无溢出。
 */
export default function SettingsPage() {
  return (
    <SectionBoundary>
      <ClientOnly>
        <SettingsContent />
      </ClientOnly>
    </SectionBoundary>
  );
}
