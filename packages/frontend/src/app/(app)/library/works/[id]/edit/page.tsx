"use client";

import { Keys } from "@/atoms/keys";
import { deleteWorkAtom, updateWorkAtom, workAliasesQuery, workChaptersQuery, workCreditsQuery, workQuery, workRequirementsQuery, workRevisionsQuery, workTagsQuery } from "@/atoms/works";
import { SectionBoundary } from "@/components/SectionBoundary";
import { AliasEditor } from "@/components/library/AliasEditor";
import { ChapterListEditor } from "@/components/library/ChapterListEditor";
import { CreditsEditor } from "@/components/library/CreditsEditor";
import { RequirementsEditor } from "@/components/library/RequirementsEditor";
import { TagEditor } from "@/components/library/TagEditor";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { WorkPicker } from "@/components/shared/WorkPicker";
import { toPortableTextContent } from "@/lib/portable-text";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function EditWorkForm({ id }: { readonly id: string }) {
  const [t] = useT();
  const router = useRouter();
  const result = useAtomSuspense(workQuery(id));
  const work = result.value;
  const updateWork = useAtomSet(updateWorkAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(work.title);
  const [originalTitle, setOriginalTitle] = useState(work.originalTitle ?? "");
  const [coverUrl, setCoverUrl] = useState(work.coverUrl ?? "");
  const [releaseDate, setReleaseDate] = useState(work.releaseDate ? new Date(work.releaseDate).toISOString().split("T")[0]! : "");
  const [isbn, setIsbn] = useState(work.isbn ?? "");
  const [pageCount, setPageCount] = useState(work.pageCount?.toString() ?? "");
  const [runtimeMinutes, setRuntimeMinutes] = useState(work.runtimeMinutes?.toString() ?? "");
  const [seasonCount, setSeasonCount] = useState(work.seasonCount?.toString() ?? "");
  const [episodeCount, setEpisodeCount] = useState(work.episodeCount?.toString() ?? "");
  const [website, setWebsite] = useState(work.website ?? "");
  const [targetWorkId, setTargetWorkId] = useState<string | undefined>(work.targetWorkId ?? undefined);
  const [description, setDescription] = useState<ReadonlyArray<unknown> | undefined>(work.description ?? undefined);
  const [reason, setReason] = useState("");

  const handleSave = () => {
    startTransition(async () => {
      await updateWork({
        params: { id },
        payload: {
          title,
          originalTitle: originalTitle || undefined,
          coverUrl: coverUrl || undefined,
          releaseDate: releaseDate ? new Date(releaseDate) : undefined,
          isbn: isbn || undefined,
          pageCount: pageCount ? parseInt(pageCount) : undefined,
          runtimeMinutes: runtimeMinutes ? parseInt(runtimeMinutes) : undefined,
          seasonCount: seasonCount ? parseInt(seasonCount) : undefined,
          episodeCount: episodeCount ? parseInt(episodeCount) : undefined,
          website: website || undefined,
          targetWorkId: targetWorkId ?? null,
          description: toPortableTextContent(description),
          reason: reason || undefined,
        },
        reactivityKeys: [Keys.work(id), Keys.works, Keys.workRevisions(id)],
      });
      router.push(`/library/works/${id}`);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.title}</span>
          <Input onChange={(e) => setTitle(e.target.value)} value={title} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.originalTitle}</span>
          <Input onChange={(e) => setOriginalTitle(e.target.value)} value={originalTitle} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.library.releaseDate}</span>
            <Input onChange={(e) => setReleaseDate(e.target.value)} type="date" value={releaseDate} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Cover URL</span>
            <Input onChange={(e) => setCoverUrl(e.target.value)} value={coverUrl} />
          </div>
        </div>
        {work.type === "book" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.library.isbn}</span>
              <Input onChange={(e) => setIsbn(e.target.value)} value={isbn} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.library.pageCount}</span>
              <Input onChange={(e) => setPageCount(e.target.value)} type="number" value={pageCount} />
            </div>
          </div>
        )}
        {(work.type === "movie" || work.type === "tv") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.library.runtime}</span>
              <Input onChange={(e) => setRuntimeMinutes(e.target.value)} type="number" value={runtimeMinutes} />
            </div>
            {work.type === "tv" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">{t.library.seasons}</span>
                  <Input onChange={(e) => setSeasonCount(e.target.value)} type="number" value={seasonCount} />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">{t.library.episodes}</span>
                  <Input onChange={(e) => setEpisodeCount(e.target.value)} type="number" value={episodeCount} />
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.website}</span>
          <Input onChange={(e) => setWebsite(e.target.value)} value={website} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.variant} — {t.library.mainWork}</span>
          <WorkPicker onValueChange={setTargetWorkId} placeholder={t.library.mainWork} value={targetWorkId} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.overview}</span>
          <PortableTextEditor initialValue={work.description ?? undefined} onChange={setDescription} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.revision.reason} ({t.common.optional})</span>
          <Input onChange={(e) => setReason(e.target.value)} value={reason} />
        </div>
        <Button className="self-start" disabled={isPending || !title.trim()} onClick={handleSave}>
          {t.common.save}
        </Button>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.credits}</h2>
        <SectionBoundary>
          <CreditsEditorSection workId={id} workType={work.type} />
        </SectionBoundary>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.aliases}</h2>
        <SectionBoundary>
          <AliasEditorSection workId={id} />
        </SectionBoundary>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.chapter.chapters}</h2>
        <SectionBoundary>
          <ChapterEditorSection workId={id} />
        </SectionBoundary>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.tags}</h2>
        <SectionBoundary>
          <TagEditorSection workId={id} />
        </SectionBoundary>
      </section>

      {work.type === "game" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t.library.requirements}</h2>
          <SectionBoundary>
            <RequirementsEditorSection workId={id} />
          </SectionBoundary>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.revision.revisions}</h2>
        <SectionBoundary>
          <RevisionHistory workId={id} />
        </SectionBoundary>
      </section>

      <DeleteWorkSection workId={id} />
    </div>
  );
}

function CreditsEditorSection({ workId, workType }: { readonly workId: string; readonly workType: string }) {
  const result = useAtomSuspense(workCreditsQuery(workId));
  return <CreditsEditor credits={result.value.map((c) => ({ creatorId: c.creatorId, creatorName: c.creatorName, role: c.role, characterName: c.characterName }))} workId={workId} workType={workType} />;
}

function AliasEditorSection({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workAliasesQuery(workId));
  return <AliasEditor aliases={result.value} workId={workId} />;
}

function ChapterEditorSection({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workChaptersQuery(workId));
  return <ChapterListEditor chapters={result.value} workId={workId} />;
}

function RequirementsEditorSection({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workRequirementsQuery(workId));
  return <RequirementsEditor requirements={result.value} workId={workId} />;
}

function TagEditorSection({ workId }: { readonly workId: string }) {
  const result = useAtomSuspense(workTagsQuery(workId));
  return <TagEditor tags={result.value} workId={workId} />;
}

function DeleteWorkSection({ workId }: { readonly workId: string }) {
  const [t] = useT();
  const router = useRouter();
  const deleteWork = useAtomSet(deleteWorkAtom, { mode: "promise" });
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-destructive text-lg font-semibold">{t.common.delete}</h2>
      <Button
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        size="sm"
        variant="destructive"
      >
        {t.common.delete}
      </Button>
      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.post.deleteConfirmBody}
        destructive
        onConfirm={() => {
          startTransition(async () => {
            await deleteWork({ params: { id: workId }, reactivityKeys: [Keys.works] });
            router.push("/library");
          });
        }}
        onOpenChange={(open) => setConfirmOpen(open)}
        open={isConfirmOpen}
        title={`${t.common.delete}?`}
      />
    </section>
  );
}

function RevisionHistory({ workId }: { readonly workId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(workRevisionsQuery(workId));

  if (result.value.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.common.noResults}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {result.value.map((rev) => (
        <Card className="flex items-center gap-2 p-3 text-sm" key={rev.id}>
          <UserLink id={rev.editedById} />
          {rev.reason && <span className="text-muted-foreground min-w-0 truncate">— {rev.reason}</span>}
          <span className="text-muted-foreground ml-auto shrink-0">
            <TimeAgo date={rev.createdAt} />
          </span>
        </Card>
      ))}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Edit Work                                |
 * | +--------------------------------------+ |
 * | | Title     [_____________________]    | |
 * | | Orig.     [_____________________]    | |
 * | | Date      [________]                 | |
 * | | Cover URL [_____________________]    | |
 * | | (type-specific fields)               | |
 * | | Website   [_____________________]    | |
 * | | Description [PortableTextEditor]     | |
 * | | Reason    [_____________________]    | |
 * | | [Save]                               | |
 * | +--------------------------------------+ |
 * |                                          |
 * | Credits                                  |
 * | [CreditsEditor]                          |
 * | Aliases                                  |
 * | [AliasEditor]                            |
 * | Chapters                                 |
 * | [ChapterListEditor]                      |
 * | Requirements (game only)                 |
 * | [RequirementsEditor]                     |
 * | Revision History                         |
 * | [rev card] [rev card] ...               |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Edit Work                                          |
 * | +------------------------------------------------+ |
 * | | Title  [__________]  Orig  [__________]        | |
 * | |  ^--- grid-cols-2, form fields side by side    | |
 * | | [Save]                                         | |
 * | +------------------------------------------------+ |
 * | Credits / Aliases / Chapters / etc sections        |
 * +----------------------------------------------------+
 *         w-full max-w-4xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Edit Work                                              |
 * |     Same as Tablet, wider margins                          |
 * +------------------------------------------------------------+
 *           w-full max-w-4xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Edit Work                                                    |
 * |         Same as Desktop, wider margins                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-4xl mx-auto
 *
 * max-w-4xl 居中容器。分区长表单：
 * 元数据 Card（类型特定字段按 work.type 条件渲染）+ CreditsEditor + AliasEditor
 * + ChapterListEditor + RequirementsEditor(game) + 修订历史。
 * 表单字段 grid-cols-1 sm:grid-cols-2 窄端单列宽端双列。
 * 标签（Label）与输入框垂直堆叠。
 * 修订历史 = Card 列表，每行 UserLink + reason(truncate) + TimeAgo(shrink-0)。
 * 边界：0 修订 → 空提示。非 game 类型 → 不渲染需求表编辑器。
 */
export default function EditWorkPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{t.library.editWork}</h1>
      <SectionBoundary>
        <EditWorkForm id={params.id} />
      </SectionBoundary>
    </div>
  );
}
