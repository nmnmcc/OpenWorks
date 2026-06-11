const formatters = new Map<string, Intl.RelativeTimeFormat>();

const UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

export function formatRelativeTime(date: Date, localeTag: string): string {
  const cached = formatters.get(localeTag);
  const formatter = cached ?? new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });
  if (!cached) {
    formatters.set(localeTag, formatter);
  }

  const diff = date.getTime() - Date.now();
  const elapsed = Math.abs(diff);

  for (const [unit, millis] of UNITS) {
    if (elapsed >= millis) {
      return formatter.format(Math.trunc(diff / millis), unit);
    }
  }
  return formatter.format(Math.trunc(diff / 1000), "second");
}
