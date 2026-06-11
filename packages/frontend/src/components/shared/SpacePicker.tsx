"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { inputVariants } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Combobox, createListCollection, Portal } from "@ark-ui/react";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PROFILE_ID = "__profile__";

interface SpaceHit {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly memberCount: number;
  readonly description: string | null;
}

interface ProfileOption {
  readonly name: string;
  readonly image: string | null;
}

interface SpacePickerProps {
  readonly value: string | undefined;
  readonly onValueChange: (spaceId: string | undefined) => void;
  readonly placeholder?: string;
  /** 提供后，默认列表首项为"发布到个人主页"，选中即 onValueChange(undefined)。 */
  readonly profileOption?: ProfileOption;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Search state (click/focus, query empty -- default list):
 * +--------------------------------------+
 * | [s] Search communities...            |  <- input w-full (fills parent)
 * +--------------------------------------+
 * | (me) UserName............ (truncate) |  <- profile entry, first
 * |      Your profile                    |     (only when profileOption given)
 * | (av) Community Name...... (truncate) |  <- joined spaces (limit 10)
 * |      1,234 members                   |
 * |      Description text.... (truncate) |
 * +--------------------------------------+
 *  dropdown: min-w-(--reference-width), max-w-(--available-width), max-h-80
 *
 * Search state (typing -- Meilisearch results, no profile entry):
 * +--------------------------------------+
 * | [s] que|                             |
 * +--------------------------------------+
 * | (av) Matching Space...... (truncate) |
 * |      567 members                     |
 * |      Description text.... (truncate) |
 * +--------------------------------------+
 *
 * Selected state (space):
 * +--------------------------------------+
 * | (av) Community Name............ [x]  |
 * |  ^shrink-0 ^min-w-0+truncate ^ml-auto shrink-0
 * +--------------------------------------+
 *
 * Selected state (profile):
 * +--------------------------------------+
 * | (me) UserName...... Your profile [x] |
 * |  ^shrink-0 ^min-w-0+truncate ^shrink-0 ^ml-auto shrink-0
 * +--------------------------------------+
 *
 * 社区搜索选择器（Ark Combobox）。点击/聚焦时默认列出"个人主页"首项
 * （传入 profileOption 时）+ 已加入社区首页（limit 10），输入后 250ms
 * 防抖切换为 Meilisearch 全站搜索；永不全量拉取社区列表。列表项展示
 * 头像、名称、成员数与描述（各自单行 truncate）。窄端：选中行与下拉项
 * 文本均 min-w-0 + truncate，头像/清除按钮/个人主页标签 shrink-0；下拉
 * 内容被 --available-width 封顶不超视口。宽端：输入框与选中行占满父宽，
 * 下拉最小宽对齐输入框（--reference-width）。
 * 边界：value 预设但无选中对象（从社区页打开）→ 按 id 取回该社区展示；
 *       搜索无结果 → 居中"无结果"提示；清除选择 → 回到搜索态；
 *       选中"个人主页"→ 显式已选态（不再回到空输入框）。
 */
export function SpacePicker({ value, onValueChange, placeholder, profileOption }: SpacePickerProps) {
  const [t] = useT();
  const [items, setItems] = useState<ReadonlyArray<SpaceHit>>([]);
  const [selected, setSelected] = useState<SpaceHit | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const [isProfileSelected, setIsProfileSelected] = useState(false);
  const joinedRef = useRef<ReadonlyArray<SpaceHit>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/spaces/?joined=true&limit=10", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          const spaces: ReadonlyArray<SpaceHit> = await response.json();
          joinedRef.current = spaces;
          setItems((current) => (current.length === 0 ? spaces : current));
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (value === undefined || selected?.id === value) {
      return;
    }
    const controller = new AbortController();
    fetch(`/api/spaces/${value}`, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          setSelected(await response.json());
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [value, selected]);

  const fetchSpaces = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setItems(joinedRef.current);
      setSearched(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/spaces/search?q=${encodeURIComponent(query.trim())}&limit=10`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setItems(data.hits);
          setSearched(true);
        }
      } catch {
        // silently ignore
      }
    }, 250);
  }, []);

  const listItems = useMemo(
    () =>
      profileOption !== undefined && !searched
        ? [
            { id: PROFILE_ID, name: profileOption.name, icon: profileOption.image, memberCount: 0, description: null },
            ...items,
          ]
        : items,
    [items, searched, profileOption],
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: [...listItems],
        itemToValue: (item) => item.id,
        itemToString: (item) => item.name,
      }),
    [listItems],
  );

  function clearSelection() {
    setSelected(undefined);
    setIsProfileSelected(false);
    setItems(joinedRef.current);
    setSearched(false);
    onValueChange(undefined);
  }

  if (isProfileSelected && value === undefined && profileOption !== undefined) {
    return (
      <div className={cn(inputVariants(), "flex items-center gap-2")}>
        <Avatar size="sm">
          <AvatarImage alt={profileOption.name} src={profileOption.image ?? undefined} />
          <AvatarFallback>{profileOption.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm">{profileOption.name}</span>
        <span className="text-muted-foreground shrink-0 text-xs">{t.composer.yourProfile}</span>
        <button
          className="text-muted-foreground hover:text-foreground ml-auto shrink-0 transition-colors"
          onClick={clearSelection}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  if (selected !== undefined && value !== undefined) {
    return (
      <div className={cn(inputVariants(), "flex items-center gap-2")}>
        <Avatar size="sm">
          <AvatarImage alt={selected.name} src={selected.icon ?? undefined} />
          <AvatarFallback>{selected.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm">{selected.name}</span>
        <button
          className="text-muted-foreground hover:text-foreground ml-auto shrink-0 transition-colors"
          onClick={clearSelection}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <Combobox.Root
      collection={collection}
      inputBehavior="autohighlight"
      lazyMount
      loopFocus
      onInputValueChange={(details) => fetchSpaces(details.inputValue)}
      onValueChange={(details) => {
        const spaceId = details.value[0];
        if (spaceId === PROFILE_ID) {
          setIsProfileSelected(true);
          onValueChange(undefined);
        } else if (spaceId !== undefined) {
          const space = items.find((item) => item.id === spaceId);
          setSelected(space);
          onValueChange(spaceId);
        }
      }}
      openOnClick
      unmountOnExit
    >
      <Combobox.Control>
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
          <Combobox.Input className={cn(inputVariants(), "pl-9")} placeholder={placeholder} />
        </div>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content
            className={cn(
              "z-50 max-h-80 max-w-(--available-width) min-w-(--reference-width) overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg/5",
              "origin-(--transform-origin)",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[98%]",
              "data-[placement=bottom]:slide-in-from-top-2",
              "data-[placement=top]:slide-in-from-bottom-2",
            )}
          >
            {listItems.map((space) => (
              <Combobox.Item
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none",
                  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                )}
                item={space}
                key={space.id}
              >
                <Avatar size="sm">
                  <AvatarImage alt={space.name} src={space.icon ?? undefined} />
                  <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <Combobox.ItemText className="truncate font-medium">{space.name}</Combobox.ItemText>
                  <span className="text-muted-foreground truncate text-xs">
                    {space.id === PROFILE_ID ? t.composer.yourProfile : t.spaces.members(space.memberCount)}
                  </span>
                  {space.description !== null && space.description.length > 0 && (
                    <span className="text-muted-foreground truncate text-xs">{space.description}</span>
                  )}
                </div>
              </Combobox.Item>
            ))}
            {searched && items.length === 0 && (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">{t.common.noResults}</div>
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
