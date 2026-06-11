"use client";

import { Keys } from "@/atoms/keys";
import { createSpaceAtom } from "@/atoms/spaces";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Visibility = "public" | "restricted" | "private";

function parseVisibility(value: string): Visibility {
  return value === "restricted" || value === "private" ? value : "public";
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Trigger: [+ Create] button
 *
 * +--------------------------------------+
 * | Create Space                         |
 * | [error?]                             |
 * | Name        [input]                  |
 * | Slug        [input] (pattern hint)   |
 * | Description [textarea rows=3]        |
 * | Visibility  [select: pub/res/priv]   |
 * | [switch] NSFW                        |
 * |              [Cancel]  [Create]      |
 * +--------------------------------------+
 *
 * 模态对话框（Dialog），所有断点布局一致（对话框宽度由 DialogContent 控制，
 * max-w 封顶、窄视口收缩至视口宽）。
 * 宽度处置：表单控件独占一行（w-full）；NSFW 行 = switch（shrink-0）+ 固定
 * 短标签；footer 按钮行 <640px 纵向堆叠（flex-col-reverse，各占满整行）、
 * >=640px 右对齐固定宽按钮（shrink-0），留白落在行首。
 * 表单 flex-col gap-4。创建成功后跳转至新空间页。
 * 边界：slug 仅允许 [a-z0-9-]+（pattern 校验）。
 */
export function CreateSpaceDialog() {
  const [t] = useT();
  const router = useRouter();
  const createSpace = useAtomSet(createSpaceAtom, { mode: "promise" });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [nsfw, setNsfw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const space = await createSpace({
        payload: {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim().length > 0 ? description.trim() : undefined,
          visibility,
          nsfw,
        },
        reactivityKeys: [Keys.spaces],
      });
      router.push(`/spaces/${space.id}`);
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
          {t.spaces.create}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader title={t.spaces.create} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="space-name">
                {t.spaces.name}
              </label>
              <Input
                id="space-name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="space-slug">
                {t.spaces.slug}
              </label>
              <Input
                id="space-slug"
                maxLength={100}
                onChange={(event) => setSlug(event.target.value)}
                pattern="[a-z0-9-]+"
                required
                value={slug}
              />
              <p className="text-muted-foreground text-xs">{t.spaces.slugHint}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="space-description">
                {t.spaces.description}
              </label>
              <Textarea
                id="space-description"
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.spaces.visibility}</span>
              <SimpleSelect
                ariaLabel={t.spaces.visibility}
                items={[
                  { value: "public", label: t.spaces.visibilityPublic },
                  { value: "restricted", label: t.spaces.visibilityRestricted },
                  { value: "private", label: t.spaces.visibilityPrivate },
                ]}
                onChange={(value) => setVisibility(parseVisibility(value))}
                value={visibility}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={nsfw} onCheckedChange={(details) => setNsfw(details.checked)} />
              {t.spaces.nsfwLabel}
            </label>
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
