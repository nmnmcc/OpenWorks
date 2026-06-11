"use client";

import { Keys } from "@/atoms/keys";
import { creatorQuery, creatorRevisionsQuery, updateCreatorAtom } from "@/atoms/creators";
import { SectionBoundary } from "@/components/SectionBoundary";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
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

function EditCreatorForm({ id }: { readonly id: string }) {
  const [t] = useT();
  const router = useRouter();
  const result = useAtomSuspense(creatorQuery(id));
  const creator = result.value;
  const updateCreator = useAtomSet(updateCreatorAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(creator.name);
  const [kind, setKind] = useState<"person" | "organization">(creator.kind as "person" | "organization");
  const [imageUrl, setImageUrl] = useState(creator.imageUrl ?? "");
  const [bio, setBio] = useState<ReadonlyArray<unknown> | undefined>(creator.bio ?? undefined);
  const [reason, setReason] = useState("");

  const handleSave = () => {
    startTransition(async () => {
      await updateCreator({
        params: { id },
        payload: {
          name,
          kind,
          imageUrl: imageUrl || undefined,
          bio: toPortableTextContent(bio),
          reason: reason || undefined,
        },
        reactivityKeys: [Keys.creator(id), Keys.creators, Keys.creatorRevisions(id)],
      });
      router.push(`/library/creators/${id}`);
    });
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.creators}</span>
          <Input onChange={(e) => setName(e.target.value)} value={name} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.common.status}</span>
          <SimpleSelect
            items={[
              { value: "person", label: t.library.person },
              { value: "organization", label: t.library.organization },
            ]}
            onChange={(val) => setKind(val as "person" | "organization")}
            value={kind}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Image URL</span>
        <Input onChange={(e) => setImageUrl(e.target.value)} value={imageUrl} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Bio</span>
        <PortableTextEditor initialValue={creator.bio ?? undefined} onChange={setBio} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.library.revision.reason} ({t.common.optional})</span>
        <Input onChange={(e) => setReason(e.target.value)} value={reason} />
      </div>
      <Button className="self-start" disabled={isPending || !name.trim()} onClick={handleSave}>
        {t.common.save}
      </Button>
    </Card>
  );
}

function RevisionHistory({ creatorId }: { readonly creatorId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(creatorRevisionsQuery(creatorId));

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
 * | Edit Creator                             |
 * | +--------------------------------------+ |
 * | | Name      [_____________________]    | |
 * | | Kind      [Person v]                 | |
 * | | Image URL [_____________________]    | |
 * | | Bio       [PortableTextEditor]       | |
 * | | Reason    [_____________________]    | |
 * | | [Save]                               | |
 * | +--------------------------------------+ |
 * |                                          |
 * | Revision History                         |
 * | [rev card] [rev card]                    |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Edit Creator                                       |
 * | +------------------------------------------------+ |
 * | | Name [________] Kind [Person v]                | |
 * | |  ^--- grid-cols-2                              | |
 * | | [Save]                                         | |
 * | +------------------------------------------------+ |
 * | Revision History                                   |
 * +----------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Same as Tablet, wider margins                          |
 * +------------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Same as Desktop, wider margins                               |
 * +----------------------------------------------------------------------+
 *               w-full max-w-3xl mx-auto
 *
 * max-w-3xl 居中容器。表单 Card + 修订历史。
 * 字段 grid-cols-1 sm:grid-cols-2。Bio 使用 PortableTextEditor。
 * 修订历史 = Card 列表（UserLink + reason truncate + TimeAgo shrink-0）。
 * 保存后跳转到创作者详情页。
 */
export default function EditCreatorPage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold">{t.common.edit} — {t.library.creators}</h1>
      <SectionBoundary>
        <EditCreatorForm id={params.id} />
      </SectionBoundary>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.library.revision.revisions}</h2>
        <SectionBoundary>
          <RevisionHistory creatorId={params.id} />
        </SectionBoundary>
      </section>
    </div>
  );
}
