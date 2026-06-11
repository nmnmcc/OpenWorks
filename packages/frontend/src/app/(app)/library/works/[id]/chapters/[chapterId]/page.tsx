"use client";

import { Keys } from "@/atoms/keys";
import { chapterQuery, markChapterReadAtom, unmarkChapterReadAtom, workChaptersQuery } from "@/atoms/works";
import { SectionBoundary } from "@/components/SectionBoundary";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTransition } from "react";

function ChapterReader({ workId, chapterId }: { readonly workId: string; readonly chapterId: string }) {
  const [t] = useT();
  const chapterResult = useAtomSuspense(chapterQuery(chapterId));
  const chaptersResult = useAtomSuspense(workChaptersQuery(workId));
  const markRead = useAtomSet(markChapterReadAtom, { mode: "promise" });
  const unmarkRead = useAtomSet(unmarkChapterReadAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const chapter = chapterResult.value;
  const chapters = chaptersResult.value;
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const currentChapterMeta = chapters[currentIndex];
  const isRead = currentChapterMeta?.isRead ?? false;
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : undefined;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : undefined;

  const handleToggleRead = () => {
    startTransition(async () => {
      if (isRead) {
        await unmarkRead({ params: { chapterId }, reactivityKeys: [Keys.chapter(chapterId), Keys.workChapters(workId), Keys.library] });
      } else {
        await markRead({ params: { chapterId }, reactivityKeys: [Keys.chapter(chapterId), Keys.workChapters(workId), Keys.library] });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-muted-foreground text-sm hover:underline" href={`/library/works/${workId}`}>
          ← {t.nav.back}
        </Link>
        <h1 className="text-xl font-semibold wrap-anywhere">{chapter.title}</h1>
      </div>

      {chapter.content && (
        <article className="prose dark:prose-invert mx-auto w-full max-w-prose">
          <PortableTextView value={chapter.content} />
        </article>
      )}

      <div className="flex items-center justify-between gap-2">
        {prevChapter ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/library/works/${workId}/chapters/${prevChapter.id}`}>
              <ChevronLeftIcon className="size-4" />
              {t.library.chapter.previousChapter}
            </Link>
          </Button>
        ) : (
          <div />
        )}

        <Button disabled={isPending} onClick={handleToggleRead} size="sm" variant={isRead ? "secondary" : "default"}>
          <CheckIcon className="size-4" />
          {isRead ? t.library.chapter.unmarkRead : t.library.chapter.markRead}
        </Button>

        {nextChapter ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/library/works/${workId}/chapters/${nextChapter.id}`}>
              {t.library.chapter.nextChapter}
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | <- Back                                  |
 * | Chapter Title (h1)                       |
 * |                                          |
 * | [PortableTextView content]               |
 * | max-w-prose, mx-auto                     |
 * |                                          |
 * | [< Prev]  [Mark Read]  [Next >]          |
 * |  ^shrink-0              ^shrink-0        |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | <- Back                                            |
 * | Chapter Title (h1)                                 |
 * |                                                    |
 * |       [PortableTextView content]                   |
 * |       max-w-prose, mx-auto                         |
 * |                                                    |
 * | [< Prev]       [Mark Read]        [Next >]         |
 * +----------------------------------------------------+
 *         w-full max-w-4xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     <- Back                                                |
 * |     Chapter Title (h1)                                     |
 * |                                                            |
 * |            [PortableTextView content]                      |
 * |            max-w-prose (65ch), mx-auto                     |
 * |                                                            |
 * |     [< Prev]        [Mark Read]         [Next >]           |
 * +------------------------------------------------------------+
 *           w-full max-w-4xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         <- Back                                                      |
 * |         Chapter Title (h1)                                           |
 * |                                                                      |
 * |                [PortableTextView content]                            |
 * |                max-w-prose (65ch), mx-auto                          |
 * |                                                                      |
 * |         [< Prev]       [Mark Read]        [Next >]                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-4xl mx-auto
 *
 * max-w-4xl 居中容器。内容区 max-w-prose (65ch) 居中，保证阅读舒适行宽。
 * 底部导航栏 justify-between：[< Prev] / [Mark Read] / [Next >]。
 * 无上一章/下一章时渲染空 div 占位保持 justify-between 布局。
 * 标题 wrap-anywhere（超长不溢出）。
 * 边界：chapter.content 为 null → 仅显示标题和导航（TV 分集可无内容）。
 *       首章无 Prev、末章无 Next。
 */
export default function ChapterReaderPage() {
  const params = useParams<{ id: string; chapterId: string }>();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <SectionBoundary>
        <ChapterReader chapterId={params.chapterId} workId={params.id} />
      </SectionBoundary>
    </div>
  );
}
