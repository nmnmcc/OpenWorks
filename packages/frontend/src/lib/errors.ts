import { toast } from "@/components/ui/toast";
import type { Translation } from "@/lib/i18n";

type ErrorMessages = Translation["errors"];

export function apiErrorMessage(errors: ErrorMessages, error: unknown): string {
  const table: Record<string, string | undefined> = errors;
  if (typeof error === "object" && error !== null && "_tag" in error && typeof error._tag === "string") {
    const message = table[error._tag];
    if (message !== undefined) {
      return message;
    }
  }
  return errors.generic;
}

export function showApiError(errors: ErrorMessages, error: unknown): void {
  toast.error({ title: apiErrorMessage(errors, error) });
}
