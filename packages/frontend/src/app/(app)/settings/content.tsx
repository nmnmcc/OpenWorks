"use client";

import { Keys } from "@/atoms/keys";
import { meQuery, updateProfileAtom } from "@/atoms/users";
import { LanguageSelect } from "@/components/settings/LanguageSelect";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import type { UserProfile } from "@openworks/backend/api";
import { useState, type FormEvent } from "react";

function ProfileForm({ me }: { readonly me: UserProfile }) {
  const [t] = useT();
  const updateProfile = useAtomSet(updateProfileAtom, { mode: "promise" });

  const [displayName, setDisplayName] = useState(me.displayName ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [image, setImage] = useState(me.image ?? "");
  const [banner, setBanner] = useState(me.banner ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile({
        payload: {
          displayName: displayName.trim().length > 0 ? displayName.trim() : null,
          bio: bio.trim().length > 0 ? bio.trim() : null,
          image: image.trim().length > 0 ? image.trim() : null,
          banner: banner.trim().length > 0 ? banner.trim() : null,
        },
        reactivityKeys: [Keys.me, Keys.user(me.id)],
      });
      toast.success({ title: t.settings.saved });
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title={t.settings.profile} />
      <form className="contents" onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="settings-display-name">
              {t.settings.displayName}
            </label>
            <Input
              id="settings-display-name"
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="settings-bio">
              {t.settings.bio}
            </label>
            <Textarea id="settings-bio" onChange={(event) => setBio(event.target.value)} rows={3} value={bio} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload id="settings-image" label={t.settings.image} onChange={setImage} value={image} />
            <ImageUpload id="settings-banner" label={t.settings.banner} onChange={setBanner} value={banner} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button isLoading={busy} type="submit">
            {t.common.save}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SettingsView() {
  const [t] = useT();
  const result = useAtomSuspense(meQuery);

  return (
    <div className="flex flex-col gap-4">
      <ProfileForm key={result.value.id} me={result.value} />

      <Card>
        <CardHeader title={t.settings.language} />
        <CardContent>
          <LanguageSelect />
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsContent() {
  const [t] = useT();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-4 text-xl font-semibold">{t.settings.title}</h1>
        <SettingsView />
      </div>
    </RequireAuth>
  );
}
