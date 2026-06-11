"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { inputVariants } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Combobox, createListCollection, Portal } from "@ark-ui/react";
import { SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CreatorHit {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
}

interface CreatorPickerProps {
  readonly value: string | undefined;
  readonly onValueChange: (creatorId: string | undefined) => void;
  readonly placeholder?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * Search state:
 * +--------------------------------------+
 * | [s] Search creators...               |
 * +--------------------------------------+
 * | (Br) Brandon Sanderson    (truncate) |
 * |      Person                          |
 * +--------------------------------------+
 *  dropdown: min-w-(--reference-width), max-w-(--available-width)
 *
 * Selected state:
 * +--------------------------------------+
 * | (Br) Brandon Sanderson......... [x]  |
 * |  ^shrink-0  ^min-w-0+truncate   ^shrink-0
 * +--------------------------------------+
 */
export function CreatorPicker({ value, onValueChange, placeholder }: CreatorPickerProps) {
  const [t] = useT();
  const [hits, setHits] = useState<ReadonlyArray<CreatorHit>>([]);
  const [selected, setSelected] = useState<CreatorHit | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const fetchCreators = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setHits([]);
      setSearched(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/creators?q=${encodeURIComponent(query.trim())}&limit=10`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setHits(Array.isArray(data) ? data : []);
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
        itemToString: (item) => item.name,
      }),
    [hits],
  );

  if (selected !== undefined && value !== undefined) {
    return (
      <div className={cn(inputVariants(), "flex items-center gap-2")}>
        <Avatar size="sm">
          <AvatarFallback>{selected.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm">{selected.name}</span>
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
      onInputValueChange={(details) => fetchCreators(details.inputValue)}
      onValueChange={(details) => {
        const creatorId = details.value[0];
        if (creatorId !== undefined) {
          const creator = hits.find((h) => h.id === creatorId);
          setSelected(creator);
          onValueChange(creatorId);
        }
      }}
      openOnClick={false}
      unmountOnExit
    >
      <Combobox.Control>
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
          <Combobox.Input className={cn(inputVariants(), "pl-9")} placeholder={placeholder ?? t.library.creators} />
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
            {hits.map((creator) => (
              <Combobox.Item
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none",
                  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                )}
                item={creator}
                key={creator.id}
              >
                <Avatar size="sm">
                  <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <Combobox.ItemText className="truncate font-medium">{creator.name}</Combobox.ItemText>
                  <span className="text-muted-foreground truncate text-xs">
                    {creator.kind === "person" ? t.library.person : t.library.organization}
                  </span>
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
