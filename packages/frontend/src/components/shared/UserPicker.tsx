"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { inputVariants } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Combobox, createListCollection, Portal } from "@ark-ui/react";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UserHit {
  readonly id: string;
  readonly name: string;
  readonly displayName: string | null;
  readonly image: string | null;
}

interface UserPickerProps {
  readonly value: string | undefined;
  readonly onValueChange: (userId: string | undefined) => void;
  readonly placeholder?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Search state:
 * +--------------------------------------+
 * | [s] Search users...                  |  <- input w-full (fills parent)
 * +--------------------------------------+
 * | (av) Display Name..       (truncate) |  <- dropdown item
 * |      @username..          (truncate) |
 * +--------------------------------------+
 *  dropdown: min-w-(--reference-width), max-w-(--available-width)
 *
 * Selected state:
 * +--------------------------------------+
 * | (av) Display Name.............. [x]  |
 * |  ^shrink-0 ^min-w-0+truncate ^ml-auto shrink-0
 * +--------------------------------------+
 *
 * 用户搜索选择器（Ark Combobox + Meilisearch 后端搜索，250ms 防抖）。
 * 窄端：选中行与下拉项的名称均 min-w-0 + truncate，头像/清除按钮 shrink-0；
 * 下拉内容被 --available-width 封顶不超视口。宽端：输入框与选中行占满父宽，
 * 下拉最小宽对齐输入框（--reference-width）。
 * 边界：无结果 → 居中"无结果"提示；查询为空 → 关闭下拉。
 */
export function UserPicker({ value, onValueChange, placeholder }: UserPickerProps) {
  const [t] = useT();
  const [hits, setHits] = useState<ReadonlyArray<UserHit>>([]);
  const [selected, setSelected] = useState<UserHit | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const fetchUsers = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setHits([]);
      setSearched(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}&limit=10`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setHits(data.hits);
          setSearched(true);
        }
      } catch {
        // silently ignore
      }
    }, 250);
  }, []);

  const collection = useMemo(
    () =>
      createListCollection({
        items: [...hits],
        itemToValue: (item) => item.id,
        itemToString: (item) => item.displayName ?? item.name,
      }),
    [hits],
  );

  if (selected !== undefined && value !== undefined) {
    return (
      <div className={cn(inputVariants(), "flex items-center gap-2")}>
        <Avatar size="sm">
          <AvatarImage alt={selected.displayName ?? selected.name} src={selected.image ?? undefined} />
          <AvatarFallback>{(selected.displayName ?? selected.name).slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm">{selected.displayName ?? selected.name}</span>
        <button
          className="text-muted-foreground hover:text-foreground ml-auto shrink-0 transition-colors"
          onClick={() => {
            setSelected(undefined);
            setHits([]);
            setSearched(false);
            onValueChange(undefined);
          }}
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
      onInputValueChange={(details) => fetchUsers(details.inputValue)}
      onValueChange={(details) => {
        const userId = details.value[0];
        if (userId !== undefined) {
          const user = hits.find((h) => h.id === userId);
          setSelected(user);
          onValueChange(userId);
        }
      }}
      openOnClick={false}
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
              "bg-popover z-50 max-h-64 max-w-(--available-width) min-w-(--reference-width) overflow-y-auto rounded-xl border p-1 shadow-lg/5",
              "origin-(--transform-origin)",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[98%]",
              "data-[placement=bottom]:slide-in-from-top-2",
              "data-[placement=top]:slide-in-from-bottom-2",
            )}
          >
            {hits.map((user) => (
              <Combobox.Item
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none",
                  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                )}
                item={user}
                key={user.id}
              >
                <Avatar size="sm">
                  <AvatarImage alt={user.displayName ?? user.name} src={user.image ?? undefined} />
                  <AvatarFallback>{(user.displayName ?? user.name).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <Combobox.ItemText className="truncate font-medium">
                    {user.displayName ?? user.name}
                  </Combobox.ItemText>
                  {user.displayName !== null && (
                    <span className="text-muted-foreground truncate text-xs">@{user.name}</span>
                  )}
                </div>
              </Combobox.Item>
            ))}
            {searched && hits.length === 0 && (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">{t.common.noResults}</div>
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
