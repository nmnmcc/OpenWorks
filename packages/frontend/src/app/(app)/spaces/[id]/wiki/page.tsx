"use client";

import { Keys } from "@/atoms/keys";
import { createWikiPageAtom, wikiPagesPageQuery } from "@/atoms/wiki";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet } from "@effect/atom-react";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function NewWikiPageDialog({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const router = useRouter();
  const createPage = useAtomSet(createWikiPageAtom, { mode: "promise" });

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = toPortableTextContent(blocks);
    if (content === undefined) {
      return;
    }
    setError("");
    setBusy(true);
    try {
      const page = await createPage({
        payload: { spaceId, slug: slug.trim(), title: title.trim(), content },
        reactivityKeys: [Keys.wiki(spaceId)],
      });
      router.push(`/spaces/${spaceId}/wiki/${page.id}`);
    } catch (cause) {
      setError(apiErrorMessage(t.errors, cause));
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => setOpen(details.open)} open={open}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          {t.wiki.newPage}
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader title={t.wiki.newPage} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="wiki-slug">
                  {t.wiki.slug}
                </label>
                <Input
                  id="wiki-slug"
                  onChange={(event) => setSlug(event.target.value)}
                  pattern="[a-z0-9-]+"
                  required
                  value={slug}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="wiki-title">
                  {t.wiki.pageTitle}
                </label>
                <Input id="wiki-title" onChange={(event) => setTitle(event.target.value)} required value={title} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="wiki-content">
                {t.wiki.content}
              </label>
              <PortableTextEditor className="min-h-56" id="wiki-content" onChange={setBlocks} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button isLoading={busy} type="submit">
              {t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WikiPageList({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<BookOpenIcon />} title={t.wiki.empty} />}
      pageQuery={(offset) => wikiPagesPageQuery(spaceId, offset)}
      renderPage={(pages) =>
        pages.map((page) => (
          <Card className="flex-row items-center justify-between gap-3 p-3 [--space:--spacing(3)]" key={page.id}>
            <div className="min-w-0">
              <Link className="block truncate font-medium hover:underline" href={`/spaces/${spaceId}/wiki/${page.id}`}>
                {page.title}
              </Link>
              <p className="text-muted-foreground truncate text-xs">{page.slug}</p>
            </div>
            <p className="text-muted-foreground shrink-0 text-xs">
              {t.common.updatedAt} <TimeAgo date={page.updatedAt} />
            </p>
          </Card>
        ))
      }
    />
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Wiki                     [+ New Page]    |
 * | +--------------------------------------+ |
 * | | Page Title        Updated 3h ago     | |
 * | | page-slug                            | |
 * | +--------------------------------------+ |
 * | | Page Title        Updated 1d ago     | |
 * | | page-slug                            | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Wiki                           [+ New Page]    |
 * | +--------------------------------------------+ |
 * | | Page Title link         Updated 3h ago     | |
 * | | page-slug                                  | |
 * | +--------------------------------------------+ |
 * | | Page Title link         Updated 1d ago     | |
 * | | page-slug                                  | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Wiki                           [+ New Page]    |
 * |       +--------------------------------------------+ |
 * |       | Page Title link         Updated 3h ago     | |
 * |       | page-slug                                  | |
 * |       +--------------------------------------------+ |
 * |       | Page Title link         Updated 1d ago     | |
 * |       | page-slug                                  | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Wiki                           [+ New Page]         |
 * |            +--------------------------------------------+      |
 * |            | Page Title link         Updated 3h ago     |      |
 * |            | page-slug                                  |      |
 * |            +--------------------------------------------+      |
 * |            | Page Title link         Updated 1d ago     |      |
 * |            | page-slug                                  |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 行内宽度处置：每项 Card 为 flex-row 横向布局——左侧标题+slug
 * （min-w-0，标题与 slug 均 truncate 截断为省略号）+ 右侧更新时间
 * （shrink-0 不压缩）；justify-between 宽端把时间推到行尾。
 * 页面标题行 = h1（固定短文本）+ [+ New Page]（按钮自带 shrink-0）。
 * 新建通过 Dialog (size=lg)，含 slug + title (sm:grid-cols-2，<640px 单列
 * 堆叠，input 均 w-full) + content 编辑器；footer 按钮行 <640px 纵向堆叠、
 * >=640px 右对齐固定宽按钮。
 * 边界：0 页 → EmptyState（书本图标）。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function WikiPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.wiki.title}</h1>
        <NewWikiPageDialog spaceId={params.id} />
      </div>
      <SectionBoundary>
        <WikiPageList spaceId={params.id} />
      </SectionBoundary>
    </div>
  );
}
