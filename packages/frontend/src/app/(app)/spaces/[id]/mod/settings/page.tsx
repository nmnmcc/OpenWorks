"use client";

import { Keys } from "@/atoms/keys";
import { deleteSpaceAtom, spaceQuery, updateSpaceAtom } from "@/atoms/spaces";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import type { Space } from "@openworks/backend/api";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Visibility = "public" | "restricted" | "private";
type PostingRestriction = "member" | "moderator" | "admin";

function parseVisibility(value: string): Visibility {
  return value === "restricted" || value === "private" ? value : "public";
}

function parsePostingRestriction(value: string): PostingRestriction {
  return value === "moderator" || value === "admin" ? value : "member";
}

function SpaceSettingsForm({ space }: { readonly space: Space }) {
  const [t] = useT();
  const router = useRouter();
  const updateSpace = useAtomSet(updateSpaceAtom, { mode: "promise" });
  const deleteSpace = useAtomSet(deleteSpaceAtom, { mode: "promise" });

  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? "");
  const [icon, setIcon] = useState(space.icon ?? "");
  const [banner, setBanner] = useState(space.banner ?? "");
  const [visibility, setVisibility] = useState<Visibility>(parseVisibility(space.visibility));
  const [postingRestriction, setPostingRestriction] = useState<PostingRestriction>(
    parsePostingRestriction(space.postingRestriction),
  );
  const [nsfw, setNsfw] = useState(space.nsfw);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateSpace({
        params: { id: space.id },
        payload: {
          name: name.trim(),
          description: description.trim().length > 0 ? description.trim() : undefined,
          icon: icon.trim().length > 0 ? icon.trim() : null,
          banner: banner.trim().length > 0 ? banner.trim() : null,
          visibility,
          postingRestriction,
          nsfw,
        },
        reactivityKeys: [Keys.spaces, Keys.space(space.id)],
      });
      toast.success({ title: t.mod.settings.saved });
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={t.mod.settings.title} />
        <form className="contents" onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="settings-name">
                {t.spaces.name}
              </label>
              <Input id="settings-name" onChange={(event) => setName(event.target.value)} required value={name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="settings-description">
                {t.spaces.description}
              </label>
              <Textarea
                id="settings-description"
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUpload id="settings-icon" label={t.mod.settings.icon} onChange={setIcon} value={icon} />
              <ImageUpload id="settings-banner" label={t.mod.settings.banner} onChange={setBanner} value={banner} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t.mod.settings.postingRestriction}</span>
                <SimpleSelect
                  ariaLabel={t.mod.settings.postingRestriction}
                  items={[
                    { value: "member", label: t.mod.settings.postingMember },
                    { value: "moderator", label: t.mod.settings.postingModerator },
                    { value: "admin", label: t.mod.settings.postingAdmin },
                  ]}
                  onChange={(value) => setPostingRestriction(parsePostingRestriction(value))}
                  value={postingRestriction}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={nsfw} onCheckedChange={(details) => setNsfw(details.checked)} />
              {t.spaces.nsfwLabel}
            </label>
          </CardContent>
          <CardFooter className="justify-end">
            <Button isLoading={busy} type="submit">
              {t.common.save}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-destructive/48">
        <CardHeader title={t.mod.settings.dangerZone} />
        <CardContent>
          <Separator className="mb-4" />
          <Button onClick={() => setDeleteOpen(true)} variant="destructive">
            {t.mod.settings.deleteSpace}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.mod.settings.deleteConfirmBody}
        destructive
        onConfirm={() =>
          deleteSpace({ params: { id: space.id }, reactivityKeys: [Keys.spaces] }).then(() => router.push("/spaces"))
        }
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t.mod.settings.deleteConfirmTitle}
      />
    </div>
  );
}

function SettingsSection({ spaceId }: { readonly spaceId: string }) {
  const result = useAtomSuspense(spaceQuery(spaceId));
  return <SpaceSettingsForm space={result.value} key={result.value.id} />;
}

/**
 * Mobile (<640px):
 *
 * +----------------------------------------------+
 * | Settings                                     |
 * | Name [input]                                 |
 * | Description [textarea]                       |
 * | Icon [ImageUpload]                           |
 * | Banner [ImageUpload]                         |
 * | Visibility [select]                          |
 * | Posting [select]                             |
 * | [switch NSFW]                                |
 * |                                [Save]        |
 * +----------------------------------------------+
 * +---------- Danger Zone (red border) ----------+
 * | [Delete Space]                               |
 * +----------------------------------------------+
 *
 * Tablet / Desktop / Ultra-wide (>=640px, sm:grid-cols-2):
 *
 * +----------------------------------------------+
 * | Settings                                     |
 * | Name [input]                                 |
 * | Description [textarea]                       |
 * | Icon [ImageUpload] | Banner [ImageUpload]    |
 * | Visibility [select] | Posting [select]       |
 * | [switch NSFW]                                |
 * |                                [Save]        |
 * +----------------------------------------------+
 * +---------- Danger Zone (red border) ----------+
 * | [Delete Space]                               |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 图片上传和 select 行使用 `grid gap-4 sm:grid-cols-2`：
 * Mobile 下单列堆叠，Tablet 及以上双列并排。
 * ModBoundary 包裹，非管理员显示权限提示。
 */
export default function ModSettingsPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <SettingsSection spaceId={params.id} />
    </ModBoundary>
  );
}
