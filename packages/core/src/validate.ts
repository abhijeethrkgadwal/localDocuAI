import type { z } from 'zod';
import { validationError } from './errors.js';
import { err, ok, type Result } from './result.js';

/** Parse input with a Zod schema and return a typed Result. */
export function parseWithSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  recovery = 'Check your inputs and try again.',
): Result<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const message = first?.message ?? 'Invalid input.';
    return err(validationError(message, recovery));
  }
  return ok(parsed.data);
}
