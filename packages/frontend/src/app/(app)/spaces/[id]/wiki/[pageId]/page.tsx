"use client";

import { Keys } from "@/atoms/keys";
import { deleteWikiPageAtom, updateWikiPageAtom, wikiPageQuery, wikiRevisionsPageQuery } from "@/atoms/wiki";
import { SectionBoundary } from "@/components/SectionBoundary";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import type { WikiPageEntry } from "@openworks/backend/api";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function WikiEditForm({ page }: { readonly page: WikiPageEntry }) {
  const [t] = useT();
  const updatePage = useAtomSet(updateWikiPageAtom, { mode: "promise" });
  const [title, setTitle] = useState(page.title);
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(page.content);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = toPortableTextContent(blocks);
    if (content === undefined) {
      return;
    }
    setBusy(true);
    try {
      await updatePage({
        params: { id: page.id },
        payload: {
          title,
          content,
          reason: reason.trim().length > 0 ? reason.trim() : undefined,
        },
        reactivityKeys: [Keys.wiki(page.spaceId), Keys.wikiPage(page.id)],
      });
      toast.success({ title: t.wiki.saved });
      setReason("");
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="wiki-edit-title">
          {t.wiki.pageTitle}
        </label>
        <Input id="wiki-edit-title" onChange={(event) => setTitle(event.target.value)} required value={title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="wiki-edit-content">
          {t.wiki.content}
        </label>
        <PortableTextEditor
          className="min-h-72"
          id="wiki-edit-content"
          initialValue={page.content}
          onChange={setBlocks}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="wiki-edit-reason">
          {t.wiki.editReason} ({t.common.optional})
        </label>
        <Input id="wiki-edit-reason" onChange={(event) => setReason(event.target.value)} value={reason} />
      </div>
      <div className="flex justify-end">
        <Button isLoading={busy} type="submit">
          {t.common.save}
        </Button>
      </div>
    </form>
  );
}

function WikiHistory({ pageId }: { readonly pageId: string }) {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState title={t.wiki.noRevisions} />}
      pageQuery={(offset) => wikiRevisionsPageQuery(pageId, offset)}
      renderPage={(revisions) =>
        revisions.map((revision) => (
          <Collapsible className="rounded-lg border px-3 py-2" key={revision.id}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5">
                <UserLink className="max-w-40 truncate" id={revision.editedById} />
                {revision.reason !== null && (
                  <span className="text-muted-foreground truncate">— {revision.reason}</span>
                )}
              </span>
              <TimeAgo className="text-muted-foreground shrink-0 text-xs" date={revision.createdAt} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="text-muted-foreground mt-2 border-t pt-2">
                <PortableTextView value={revision.content} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))
      }
    />
  );
}

function WikiPageView({ spaceId, pageId }: { readonly spaceId: string; readonly pageId: string }) {
  const [t] = useT();
  const router = useRouter();
  const result = useAtomSuspense(wikiPageQuery(pageId));
  const deletePage = useAtomSet(deleteWikiPageAtom, { mode: "promise" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const page = result.value;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold wrap-anywhere">{page.title}</h1>
          <p className="text-muted-foreground truncate text-xs">
            {page.slug} · {t.wiki.lastEditedBy} <UserLink id={page.lastEditedById} /> ·{" "}
            <TimeAgo date={page.updatedAt} />
          </p>
        </div>
        <Button onClick={() => setDeleteOpen(true)} size="sm" variant="destructive">
          {t.wiki.deletePage}
        </Button>
      </div>

      <Tabs defaultValue="view">
        <TabsList className="w-fit">
          <TabsTrigger value="view">{t.wiki.view}</TabsTrigger>
          <TabsTrigger value="edit">{t.wiki.edit}</TabsTrigger>
          <TabsTrigger value="history">{t.wiki.history}</TabsTrigger>
        </TabsList>
        <TabsContent className="pt-3" value="view">
          <PortableTextView value={page.content} />
        </TabsContent>
        <TabsContent className="pt-3" value="edit">
          <WikiEditForm page={page} />
        </TabsContent>
        <TabsContent className="pt-3" value="history">
          <SectionBoundary>
            <WikiHistory pageId={pageId} />
          </SectionBoundary>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.wiki.deleteConfirmBody}
        destructive
        onConfirm={() =>
          deletePage({ params: { id: pageId }, reactivityKeys: [Keys.wiki(spaceId)] }).then(() =>
            router.push(`/spaces/${spaceId}/wiki`),
          )
        }
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t.wiki.deleteConfirmTitle}
      />
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Page Title           [Delete Page]       |
 * | slug · edited by user · 3h ago           |
 * |------------------------------------------|
 * | [View | Edit | History]                  |
 * |------------------------------------------|
 * | View:    Rendered content                |
 * | Edit:    Title [input]                   |
 * |          Content [editor min-h-72]       |
 * |          Edit reason [input]             |
 * |                             [Save]       |
 * | History: user -- reason?      3h ago     |
 * |          [expand to see content]         |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Page Title                    [Delete Page]     |
 * | slug · Last edited by user · 3h ago             |
 * |------------------------------------------------|
 * | [View | Edit | History]                         |
 * |------------------------------------------------|
 * | View:    PortableText rendered content          |
 * | Edit:    Title [input]                          |
 * |          Content [editor min-h-72]              |
 * |          Edit reason [input]                    |
 * |                                    [Save]       |
 * | History: user -- reason?              3h ago    |
 * |          [expand to see content]                |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Page Title                    [Delete Page]     |
 * |       slug · Last edited by user · 3h ago             |
 * |       ------------------------------------------------|
 * |       [View | Edit | History]                         |
 * |       ------------------------------------------------|
 * |       View:    PortableText rendered content          |
 * |       Edit:    Title [input]                          |
 * |                Content [editor min-h-72]              |
 * |                Edit reason [input]                    |
 * |                                        [Save]        |
 * |       History: user -- reason?              3h ago    |
 * |                [expand to see content]                |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Page Title                    [Delete Page]          |
 * |            slug · Last edited by user · 3h ago                  |
 * |            ----------------------------------------------------|
 * |            [View | Edit | History]                              |
 * |            ----------------------------------------------------|
 * |            View:    PortableText rendered content               |
 * |            Edit:    Title [input]                               |
 * |                     Content [editor min-h-72]                   |
 * |                     Edit reason [input]                         |
 * |                                             [Save]             |
 * |            History: user -- reason?              3h ago         |
 * |                     [expand to see content]                     |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 行内宽度处置：头行 = 标题块（min-w-0，h1 wrap-anywhere 断行、slug/meta
 * 行 truncate）+ [Delete Page]（按钮自带 shrink-0），flex-wrap 窄端整组
 * 折行、justify-between 宽端推开两端；历史行 = 左组（min-w-0，用户名
 * max-w-40 + truncate、reason truncate）+ 时间（shrink-0）。
 * Tabs (w-fit max-w-full overflow-x-auto) 切换查看/编辑/历史三个面板。
 * 编辑面板：标题输入 + 富文本编辑器 (min-h-72) + 编辑原因输入 + 保存按钮。
 * 历史面板：每条修订为 Collapsible，展开显示内容快照。
 * 删除通过 ConfirmDialog 确认后跳转至 wiki 列表。
 * 边界：0 条修订 → EmptyState。
 *       修订列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function WikiPageDetail() {
  const params = useParams<{ id: string; pageId: string }>();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <SectionBoundary>
        <WikiPageView spaceId={params.id} pageId={params.pageId} />
      </SectionBoundary>
    </div>
  );
}
