"use client";

import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { localeAtom, useSetLocale, useT, type LocalePreference } from "@/lib/i18n/locale";
import { useAtomValue } from "@effect/atom-react";

function parsePreference(value: string): LocalePreference {
  return value === "en-US" || value === "zh-CN" || value === "zh-TW" ? value : "auto";
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 * +---------------------------+
 * | Auto                  [v] |
 * +---------------------------+
 *   | Auto                    |
 *   | English                 |
 *   | 简体中文                 |
 *   | 繁體中文                 |
 *   +-------------------------+
 *
 * 固定宽度 w-48 的 SimpleSelect。
 * 选择后立即写入 locale atom 并同步到 storage。
 */
export function LanguageSelect() {
  const [t] = useT();
  const preference = useAtomValue(localeAtom);
  const setLocale = useSetLocale();

  return (
    <SimpleSelect
      ariaLabel={t.settings.language}
      className="w-48"
      items={[
        { value: "auto", label: t.settings.languageAuto },
        { value: "en-US", label: "English" },
        { value: "zh-CN", label: "简体中文" },
        { value: "zh-TW", label: "繁體中文" },
      ]}
      onChange={(value) => setLocale(parsePreference(value))}
      value={preference}
    />
  );
}
