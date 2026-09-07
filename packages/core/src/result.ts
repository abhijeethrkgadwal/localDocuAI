import type { AppError } from './errors.js';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}

export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: AppError } {
  return !result.ok;
}

export function mapResult<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  if (!result.ok) return result;
  return ok(fn(result.value));
}
