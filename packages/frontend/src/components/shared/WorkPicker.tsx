"use client";

import { inputVariants } from "@/components/ui/input";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { Combobox, createListCollection, Portal } from "@ark-ui/react";
import { BookIcon, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface WorkHit {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly coverUrl: string | null;
  readonly releaseDate: string | null;
}

interface WorkPickerProps {
  readonly value: string | undefined;
  readonly onValueChange: (workId: string | undefined) => void;
  readonly placeholder?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Search state (click/focus, query empty -- newest works):
 * +--------------------------------------+
 * | [s] Search works...                  |  <- input w-full (fills parent)
 * +--------------------------------------+
 * | [cv] Work Title.......... (truncate) |  <- cover thumb 2:3, shrink-0
 * |      Book - 2010                     |  <- type label + year
 * +--------------------------------------+
 *  dropdown: min-w-(--reference-width), max-w-(--available-width), max-h-80
 *
 * Search state (typing -- Meilisearch results, 250ms debounce):
 * +--------------------------------------+
 * | [s] que|                             |
 * +--------------------------------------+
 * | [cv] Matching Work....... (truncate) |
 * |      Game - 2011                     |
 * +--------------------------------------+
 *
 * Selected state:
 * +--------------------------------------+
 * | [cv] Work Title............... [x]   |
 * |  ^shrink-0 ^min-w-0+truncate ^ml-auto shrink-0
 * +--------------------------------------+
 *
 * 作品搜索选择器（Ark Combobox，照 SpacePicker 范本）。点击/聚焦时默认
 * 列出最新作品（limit 10），输入后 250ms 防抖切换为 Meilisearch 全站
 * 搜索（标题/别名均可命中）；永不全量拉取作品列表。列表项展示封面缩略
 * （无封面用图标占位）、标题与"类型 - 年份"行（各自单行 truncate）。
 * 窄端：选中行与下拉项文本均 min-w-0 + truncate，封面/清除按钮 shrink-0，
 * 下拉内容被 --available-width 封顶不超视口。宽端：输入框与选中行占满
 * 父宽，下拉最小宽对齐输入框（--reference-width）。
 * 边界：value 预设但无选中对象（从作品页打开）→ 按 id 取回该作品展示；
 *       搜索无结果 → 居中"无结果"提示；清除选择 → 回到搜索态。
 */
export function WorkPicker({ value, onValueChange, placeholder }: WorkPickerProps) {
  const [t] = useT();
  const [items, setItems] = useState<ReadonlyArray<WorkHit>>([]);
  const [selected, setSelected] = useState<WorkHit | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  const recentRef = useRef<ReadonlyArray<WorkHit>>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/works/?sort=new&limit=10", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          const works: ReadonlyArray<WorkHit> = await response.json();
          recentRef.current = works;
          setItems((current) => (current.length === 0 ? works : current));
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
    fetch(`/api/works/${value}`, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          setSelected(await response.json());
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [value, selected]);

  const fetchWorks = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    if (query.trim().length === 0) {
      setItems(recentRef.current);
      setSearched(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/works/search?q=${encodeURIComponent(query.trim())}&limit=10`, {
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

  const collection = useMemo(
    () =>
      createListCollection({
        items: [...items],
        itemToValue: (item) => item.id,
        itemToString: (item) => item.title,
      }),
    [items],
  );

  function clearSelection() {
    setSelected(undefined);
    setItems(recentRef.current);
    setSearched(false);
    onValueChange(undefined);
  }

  const typeLabels: Record<string, string> = t.library.type;

  function cover(work: WorkHit) {
    return work.coverUrl !== null ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={work.title} className="h-9 w-6 shrink-0 rounded-sm object-cover" src={work.coverUrl} />
    ) : (
      <div className="bg-muted text-muted-foreground flex h-9 w-6 shrink-0 items-center justify-center rounded-sm">
        <BookIcon className="size-3.5" />
      </div>
    );
  }

  if (selected !== undefined && value !== undefined) {
    return (
      <div className={cn(inputVariants(), "flex h-auto items-center gap-2 py-1")}>
        {cover(selected)}
        <span className="min-w-0 truncate text-sm">{selected.title}</span>
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
      onInputValueChange={(details) => fetchWorks(details.inputValue)}
      onValueChange={(details) => {
        const workId = details.value[0];
        if (workId !== undefined) {
          setSelected(items.find((item) => item.id === workId));
          onValueChange(workId);
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
              "bg-popover z-50 max-h-80 max-w-(--available-width) min-w-(--reference-width) overflow-y-auto rounded-xl border p-1 shadow-lg/5",
              "origin-(--transform-origin)",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[98%]",
              "data-[placement=bottom]:slide-in-from-top-2",
              "data-[placement=top]:slide-in-from-bottom-2",
            )}
          >
            {items.map((work) => (
              <Combobox.Item
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none",
                  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                )}
                item={work}
                key={work.id}
              >
                {cover(work)}
                <div className="flex min-w-0 flex-col">
                  <Combobox.ItemText className="truncate font-medium">{work.title}</Combobox.ItemText>
                  <span className="text-muted-foreground truncate text-xs">
                    {typeLabels[work.type] ?? work.type}
                    {work.releaseDate !== null && ` · ${new Date(work.releaseDate).getFullYear()}`}
                  </span>
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
