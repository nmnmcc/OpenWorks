"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createListCollection } from "@ark-ui/react/collection";
import { useMemo } from "react";

export interface SimpleSelectItem {
  readonly value: string;
  readonly label: string;
}

interface SimpleSelectProps {
  readonly items: ReadonlyArray<SimpleSelectItem>;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 * +-------------------------+
 * | Selected label      [v] |
 * +-------------------------+
 *   | Option A              |
 *   | Option B (selected)   |
 *   | Option C              |
 *   +------------------------+
 *
 * 对 Ark UI Select 的薄包装，受控值。
 * 通过 className 控制宽度（如 "w-32"）。单选。
 * 宽度处置：触发器宽度由调用方 className 静态指定；标签超长时由
 * SelectValue（min-w-0 + truncate）截断为省略号，箭头图标 shrink-0。
 * 边界：items 列表变更 → useMemo 重建 collection。
 */
export function SimpleSelect({
  items,
  value,
  onChange,
  placeholder,
  className,
  disabled,
  ariaLabel,
}: SimpleSelectProps) {
  const collection = useMemo(() => createListCollection({ items: [...items] }), [items]);

  return (
    <Select
      aria-label={ariaLabel}
      collection={collection}
      disabled={disabled}
      onValueChange={(details) => {
        const next = details.value[0];
        if (next !== undefined) {
          onChange(next);
        }
      }}
      value={[value]}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem item={item} key={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
