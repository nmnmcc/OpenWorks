"use client";

import { postFlairsQuery } from "@/atoms/flairs";
import { Keys } from "@/atoms/keys";
import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import { createPostAtom } from "@/atoms/posts";
import { SectionBoundary } from "@/components/SectionBoundary";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { SpacePicker } from "@/components/shared/SpacePicker";
import { WorkPicker } from "@/components/shared/WorkPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

type PostType = "text" | "link" | "image" | "poll" | "review";

function parsePostType(value: string): PostType {
  return value === "link" || value === "image" || value === "poll" || value === "review" ? value : "text";
}

function FlairSelect({
  spaceId,
  value,
  onChange,
}: {
  readonly spaceId: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const [t] = useT();
  const result = useAtomValue(postFlairsQuery(spaceId));

  if (!AsyncResult.isSuccess(result) || result.value.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t.composer.flair}</span>
      <SimpleSelect
        ariaLabel={t.composer.flair}
        items={[
          { value: "", label: t.composer.noFlair },
          ...result.value.map((flair) => ({ value: flair.id, label: flair.name })),
        ]}
        onChange={onChange}
        value={value}
      />
    </div>
  );
}

function ComposerForm({
  initialSpaceId,
  initialWorkId,
  initialIsReview,
}: {
  readonly initialSpaceId: string;
  readonly initialWorkId: string | undefined;
  readonly initialIsReview: boolean;
}) {
  const [t] = useT();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const createPost = useAtomSet(createPostAtom, { mode: "promise" });
  const setDialog = useAtomSet(postComposeDialogAtom);

  const [type, setType] = useState<PostType>(initialIsReview ? "review" : "text");
  const [spaceId, setSpaceId] = useState<string | undefined>(initialSpaceId.length > 0 ? initialSpaceId : undefined);
  const [workId, setWorkId] = useState<string | undefined>(initialWorkId);
  const [flairId, setFlairId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<ReadonlyArray<unknown> | undefined>(undefined);
  const [url, setUrl] = useState("");
  const [pollOptions, setPollOptions] = useState<ReadonlyArray<string>>(["", ""]);
  const [pollEndsAt, setPollEndsAt] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [spoiler, setSpoiler] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const post = await createPost({
        payload: {
          title: title.trim(),
          type,
          workId: type === "poll" ? undefined : workId,
          content: type === "text" || type === "review" ? toPortableTextContent(body) : undefined,
          url: type === "link" || type === "image" ? url.trim() : undefined,
          spaceId,
          flairId: spaceId !== undefined && flairId.length > 0 ? flairId : undefined,
          nsfw,
          spoiler,
          pollOptions:
            type === "poll"
              ? pollOptions.map((option) => option.trim()).filter((option) => option.length > 0)
              : undefined,
          pollEndsAt: type === "poll" && pollEndsAt.length > 0 ? new Date(pollEndsAt) : undefined,
        },
        reactivityKeys: [Keys.posts],
      });
      setDialog({ open: false, spaceId: "" });
      router.push(`/posts/${post.id}`);
    } catch (error) {
      showApiError(t.errors, error);
      setBusy(false);
    }
  }

  return (
    <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
      <DialogBody className="flex flex-col gap-4">
        <Tabs onValueChange={(details) => setType(parsePostType(details.value))} value={type}>
          <TabsList>
            <TabsTrigger value="text">{t.composer.typeText}</TabsTrigger>
            <TabsTrigger value="link">{t.composer.typeLink}</TabsTrigger>
            <TabsTrigger value="image">{t.composer.typeImage}</TabsTrigger>
            <TabsTrigger value="poll">{t.composer.typePoll}</TabsTrigger>
            <TabsTrigger value="review">{t.composer.typeReview}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.composer.space}</span>
            <SpacePicker
              onValueChange={(value) => {
                setSpaceId(value);
                setFlairId("");
              }}
              placeholder={t.composer.searchSpace}
              profileOption={session ? { name: session.user.name, image: session.user.image ?? null } : undefined}
              value={spaceId}
            />
          </div>
          {spaceId !== undefined && <FlairSelect spaceId={spaceId} onChange={setFlairId} value={flairId} />}
          {type !== "poll" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{type === "review" ? t.composer.work : t.composer.linkedWork}</span>
              <WorkPicker onValueChange={setWorkId} placeholder={t.composer.searchWork} value={workId} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="compose-title">
            {t.composer.postTitle}
          </label>
          <Input
            id="compose-title"
            maxLength={300}
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </div>

        {(type === "text" || type === "review") && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="compose-body">
              {t.composer.body}
            </label>
            <PortableTextEditor className="min-h-40" id="compose-body" onChange={setBody} />
          </div>
        )}

        {type === "link" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="compose-url">
              {t.composer.url}
            </label>
            <Input
              id="compose-url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              required
              type="url"
              value={url}
            />
          </div>
        )}

        {type === "image" && (
          <ImageUpload id="compose-image-upload" label={t.composer.image} onChange={setUrl} value={url} />
        )}

        {type === "poll" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.composer.pollOptions}</span>
            {pollOptions.map((option, index) => (
              <div className="flex items-center gap-2" key={index}>
                <Input
                  onChange={(event) =>
                    setPollOptions((current) =>
                      current.map((existing, i) => (i === index ? event.target.value : existing)),
                    )
                  }
                  placeholder={t.composer.optionPlaceholder(index + 1)}
                  required
                  value={option}
                />
                {pollOptions.length > 2 && (
                  <Button
                    aria-label={t.common.remove}
                    onClick={() => setPollOptions((current) => current.filter((_, i) => i !== index))}
                    size="icon-md"
                    type="button"
                    variant="ghost"
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                disabled={pollOptions.length >= 10}
                onClick={() => setPollOptions((current) => [...current, ""])}
                size="sm"
                type="button"
                variant="outline"
              >
                {t.composer.addOption}
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-muted-foreground text-sm" htmlFor="compose-poll-ends-at">
                  {t.composer.pollEndsAt}
                </label>
                <Input
                  className="w-fit"
                  id="compose-poll-ends-at"
                  onChange={(event) => setPollEndsAt(event.target.value)}
                  size="sm"
                  type="datetime-local"
                  value={pollEndsAt}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={nsfw} onCheckedChange={(details) => setNsfw(details.checked)} />
            {t.composer.nsfwLabel}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={spoiler} onCheckedChange={(details) => setSpoiler(details.checked)} />
            {t.composer.spoilerLabel}
          </label>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => setDialog({ open: false, spaceId: "" })} type="button" variant="outline">
          {t.common.cancel}
        </Button>
        <Button disabled={type === "review" && workId === undefined} isLoading={busy} type="submit">
          {t.composer.submit}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Mobile (<640px):
 * +---------------------------------------+
 * | Create a post                     [x] |
 * |---------------------------------------|
 * | [Text | Link | Image | Poll | Review] |
 * |  ^ TabsList max-w-full, scrolls if    |
 * |    labels exceed width                |
 * | Space [picker w-full]                 |
 * | Flair [select? w-full]                |
 * | Work  [picker w-full] (hidden: poll)  |
 * | Title [input w-full max=300]          |
 * | Body / URL / Image / Poll ...         |
 * | [+ Add option]          (flex-wrap)   |
 * | Ends at [datetime]      (flex-wrap)   |
 * | [sw NSFW] [sw Spoiler]  (flex-wrap)   |
 * |---------------------------------------|
 * | [              Post               ]   |
 * | [             Cancel              ]   |
 * +---------------------------------------+
 * bottomStickOnMobile: dialog sticks to
 * bottom on <640px, full width, rounded top.
 * Space/Flair stack vertically (single col).
 * Footer buttons stack (flex-col-reverse).
 *
 * Tablet (640-1023px):
 * +--------------------------------------------+
 * | Create a post                          [x] |
 * |--------------------------------------------|
 * | [Text | Link | Image | Poll | Review]     |
 * | Space [picker]     | Flair [select?]      |
 * | Work  [picker]       (hidden when poll)   |
 * | Title [input max=300]                     |
 * | Body / URL / Image / Poll options ...     |
 * | [sw NSFW]  [sw Spoiler]                   |
 * |--------------------------------------------|
 * |                    [Cancel]  [Post]        |
 * +--------------------------------------------+
 * sm:grid-cols-2 for Space/Flair row.
 * Dialog centered, max-w-2xl.
 *
 * Desktop (1024-1535px):
 * +-----------------------------------------------+
 * | Create a post                             [x] |
 * |-----------------------------------------------|
 * | [Text | Link | Image | Poll | Review]        |
 * | Space [picker]     | Flair [select?]         |
 * | Work  [picker]       (hidden when poll)      |
 * | Title [input max=300]                        |
 * | Body / URL / Image / Poll options ...        |
 * | [sw NSFW]  [sw Spoiler]                      |
 * |-----------------------------------------------|
 * |                      [Cancel]  [Post]         |
 * +-----------------------------------------------+
 * Same as Tablet. Dialog centered, max-w-2xl.
 *
 * Ultra-wide (>=1536px):
 * Same as Desktop -- max-w-2xl dialog centered
 * with symmetric margins from the overlay grid.
 *
 * Width handling (same-row groups):
 * - Tabs row: TabsList w-fit max-w-full + overflow-x-auto, triggers
 *   whitespace-nowrap (scroll, never wrap or clip).
 * - Space/Flair/Work grid: single column <640px, sm:grid-cols-2 above;
 *   each picker w-full within its cell (stretched by grid).
 * - Review mode: Work picker is required -- submit button stays disabled
 *   until a work is selected; body uses the rich-text editor.
 * - Poll mode: Work picker hidden entirely (polls cannot link works).
 * - Poll option row: [Input (md, min-w-0, shrinks) | [x] icon-md button
 *   shrink-0] -- equal height h-8.
 * - Poll footer row: flex-wrap justify-between; [Add option] (sm) and the
 *   datetime input (size=sm) are equal height h-7; inner "Ends at" group also
 *   flex-wrap so the datetime input drops below its label at 320px.
 * - Switch row: flex-wrap (labels keep min-content, wrap on overflow).
 * - Footer: <640px stacked full-width buttons; >=640px right-aligned row of
 *   fixed-width buttons (shrink-0), leftover space on the left.
 *
 * Dialog size xl (max-w-2xl). Controlled by
 * postComposeDialogAtom. Form remounts on each
 * open via key prop to reset all state cleanly.
 */
export function PostComposeDialog() {
  const [t] = useT();
  const { open, spaceId, workId, isReview } = useAtomValue(postComposeDialogAtom);
  const setDialog = useAtomSet(postComposeDialogAtom);
  const [generation, setGeneration] = useState(0);

  function handleOpenChange(details: { readonly open: boolean }) {
    if (details.open) {
      setGeneration((g) => g + 1);
    }
    setDialog(details.open ? { open: true, spaceId, workId, isReview } : { open: false, spaceId: "" });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent size="xl">
        <DialogHeader title={t.composer.title} />
        <Suspense
          fallback={
            <div className="flex min-h-40 items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <SectionBoundary>
            <ComposerForm
              initialIsReview={isReview ?? false}
              initialSpaceId={spaceId}
              initialWorkId={workId}
              key={generation}
            />
          </SectionBoundary>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
