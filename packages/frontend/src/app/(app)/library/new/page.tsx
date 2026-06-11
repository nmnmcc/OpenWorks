"use client";

import { Keys } from "@/atoms/keys";
import { createWorkAtom } from "@/atoms/works";
import { ImportPanel } from "@/components/library/ImportPanel";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { toPortableTextContent } from "@/lib/portable-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const TYPES = ["book", "movie", "tv", "game"] as const;

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | New Work                                 |
 * | +--------------------------------------+ |
 * | | Import from external source          | |
 * | | [Source v] [ID______________] [Q]    | |
 * | +--------------------------------------+ |
 * |                                          |
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
 * | [ImportPanel]                                      |
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
 * max-w-4xl 居中容器。顶部 ImportPanel 可预填表单字段。
 * 类型 Select 驱动条件字段：book → ISBN/Pages，movie → Runtime，
 * tv → Runtime/Seasons/Episodes，game → Platforms。
 * 表单字段 grid-cols-1 sm:grid-cols-2 窄端单列宽端双列。
 * 简介使用 PortableTextEditor。创建后跳转到作品详情页。
 * 边界：导入预填覆盖已输入值（用户知情——刚点了 Import）。
 *       title 必填，其余可选。
 */
export default function NewWorkPage() {
  const [t] = useT();
  const router = useRouter();
  const createWork = useAtomSet(createWorkAtom, { mode: "promise" });
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<"book" | "movie" | "tv" | "game">("book");
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState("");
  const [seasonCount, setSeasonCount] = useState("");
  const [episodeCount, setEpisodeCount] = useState("");
  const [website, setWebsite] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);
  const [description, setDescription] = useState<ReadonlyArray<unknown> | undefined>(undefined);

  const handleImport = (data: unknown) => {
    const d = data as Record<string, unknown>;
    if (d["title"]) setTitle(d["title"] as string);
    if (d["originalTitle"]) setOriginalTitle(d["originalTitle"] as string);
    if (d["coverUrl"]) setCoverUrl(d["coverUrl"] as string);
    if (d["releaseDate"]) setReleaseDate(new Date(d["releaseDate"] as string).toISOString().split("T")[0]!);
    if (d["isbn"]) setIsbn(d["isbn"] as string);
    if (d["pageCount"]) setPageCount(String(d["pageCount"]));
    if (d["runtimeMinutes"]) setRuntimeMinutes(String(d["runtimeMinutes"]));
    if (d["type"]) setType(d["type"] as "book" | "movie" | "tv" | "game");
    if (d["description"]) setDescription(d["description"] as ReadonlyArray<unknown>);
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createWork({
        payload: {
          type,
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
          nsfw: isNsfw,
          description: toPortableTextContent(description),
        },
        reactivityKeys: [Keys.works],
      });
      router.push(`/library/works/${(result as { id: string }).id}`);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{t.library.newWork}</h1>

      <ImportPanel onImport={handleImport} />

      <Card className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Type</span>
            <SimpleSelect
              items={TYPES.map((tp) => ({ value: tp, label: t.library.type[tp] }))}
              onChange={(val) => setType(val as "book" | "movie" | "tv" | "game")}
              value={type}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.library.title}</span>
            <Input onChange={(e) => setTitle(e.target.value)} value={title} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.library.originalTitle}</span>
            <Input onChange={(e) => setOriginalTitle(e.target.value)} value={originalTitle} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Cover URL</span>
            <Input onChange={(e) => setCoverUrl(e.target.value)} value={coverUrl} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.library.releaseDate}</span>
            <Input onChange={(e) => setReleaseDate(e.target.value)} type="date" value={releaseDate} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.library.website}</span>
            <Input onChange={(e) => setWebsite(e.target.value)} value={website} />
          </div>
        </div>

        {type === "book" && (
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

        {(type === "movie" || type === "tv") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.library.runtime}</span>
              <Input onChange={(e) => setRuntimeMinutes(e.target.value)} type="number" value={runtimeMinutes} />
            </div>
            {type === "tv" && (
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

        <div className="flex items-center gap-2">
          <Checkbox checked={isNsfw} onCheckedChange={(details) => setIsNsfw(details.checked === true)} />
          <span className="text-sm font-medium">{t.library.nsfw}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t.library.overview}</span>
          <PortableTextEditor onChange={setDescription} />
        </div>

        <Button className="self-start" disabled={isPending || !title.trim()} onClick={handleCreate}>
          {t.common.create}
        </Button>
      </Card>
    </div>
  );
}
