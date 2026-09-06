import type { AppError } from './errors.js';

export interface FormattedAppError {
  /** Human-readable primary message */
  message: string;
  /** Technical category for support / logging (not a stack trace) */
  category: AppError['category'];
  /** What the user can try next */
  recovery: string | null;
  /** File names involved when present */
  affectedFiles: string[];
}

/** Normalize AppError for UI display — never exposes stack traces. */
export function formatAppError(error: AppError): FormattedAppError {
  return {
    message: error.message,
    category: error.category,
    recovery: error.recovery ?? null,
    affectedFiles: getAffectedFiles(error),
  };
}

export function getAffectedFiles(error: AppError): string[] {
  const raw = error.details?.affectedFiles;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item));
}

/** Single-line status text: message + optional recovery. */
export function formatAppErrorLine(error: AppError): string {
  const formatted = formatAppError(error);
  if (formatted.recovery) {
    return `${formatted.message} ${formatted.recovery}`;
  }
  return formatted.message;
}
