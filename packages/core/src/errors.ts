/** Technical error categories exposed to callers (never stack traces to end users). */
export const ErrorCategory = {
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  UNSUPPORTED: 'unsupported',
  CORRUPT: 'corrupt',
  ENCRYPTED: 'encrypted',
  CANCELLED: 'cancelled',
  INTERNAL: 'internal',
} as const;

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export interface AppError {
  message: string;
  category: ErrorCategory;
  recovery?: string;
  details?: Record<string, unknown>;
}

export function validationError(message: string, recovery?: string): AppError {
  return { message, category: ErrorCategory.VALIDATION, recovery };
}

export function permissionError(message: string, recovery?: string): AppError {
  return { message, category: ErrorCategory.PERMISSION, recovery };
}

export function cancelledError(message = 'Operation was cancelled.'): AppError {
  return {
    message,
    category: ErrorCategory.CANCELLED,
    recovery: 'Run the operation again when ready.',
  };
}

export function encryptedError(
  message: string,
  details?: Record<string, unknown>,
  recovery?: string,
): AppError {
  return {
    message,
    category: ErrorCategory.ENCRYPTED,
    recovery: recovery ?? 'Remove or unlock password-protected files, then retry.',
    details,
  };
}

export function corruptError(
  message: string,
  details?: Record<string, unknown>,
  recovery?: string,
): AppError {
  return {
    message,
    category: ErrorCategory.CORRUPT,
    recovery: recovery ?? 'Remove or replace the affected files, then retry.',
    details,
  };
}

export function internalError(message: string, details?: Record<string, unknown>): AppError {
  return {
    message,
    category: ErrorCategory.INTERNAL,
    recovery: 'Try again. If the problem continues, report it with the technical category.',
    details,
  };
}

export function unsupportedError(
  message: string,
  recovery?: string,
  details?: Record<string, unknown>,
): AppError {
  return {
    message,
    category: ErrorCategory.UNSUPPORTED,
    recovery: recovery ?? 'This operation is not available yet.',
    details,
  };
}

export function notFoundError(message: string, recovery?: string): AppError {
  return {
    message,
    category: ErrorCategory.NOT_FOUND,
    recovery: recovery ?? 'Check that the file exists and try again.',
  };
}
