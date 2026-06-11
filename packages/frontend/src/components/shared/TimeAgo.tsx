"use client";

import { useT } from "@/lib/i18n/locale";
import { formatRelativeTime } from "@/lib/time";

interface TimeAgoProps {
  readonly date: Date;
  readonly className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [, tag] = useT();

  return (
    <time className={className} dateTime={date.toISOString()} title={date.toLocaleString(tag)}>
      {formatRelativeTime(date, tag)}
    </time>
  );
}
