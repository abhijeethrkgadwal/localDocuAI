import { describe, expect, it } from 'vitest';
import {
  corruptError,
  encryptedError,
  formatAppError,
  formatAppErrorLine,
  getAffectedFiles,
  validationError,
} from '../src/index.js';

describe('formatAppError', () => {
  it('exposes message, category, and recovery without stacks', () => {
    const formatted = formatAppError(
      validationError('Bad input.', 'Try again with valid files.'),
    );
    expect(formatted.message).toBe('Bad input.');
    expect(formatted.category).toBe('validation');
    expect(formatted.recovery).toBe('Try again with valid files.');
    expect(formatted.affectedFiles).toEqual([]);
  });

  it('extracts affectedFiles from details', () => {
    const error = corruptError('Broken PDFs.', { affectedFiles: ['a.pdf', 'b.pdf'] });
    expect(getAffectedFiles(error)).toEqual(['a.pdf', 'b.pdf']);
    expect(formatAppError(error).affectedFiles).toEqual(['a.pdf', 'b.pdf']);
  });

  it('builds a single-line message with recovery', () => {
    const line = formatAppErrorLine(encryptedError('Locked.', { affectedFiles: ['x.pdf'] }));
    expect(line).toContain('Locked.');
    expect(line).toContain('password');
  });

  it('allows custom recovery overrides on corrupt/encrypted helpers', () => {
    const error = corruptError(
      'Mixed failures.',
      { affectedFiles: ['a.pdf'] },
      'Unlock passwords and replace damaged files.',
    );
    expect(error.recovery).toBe('Unlock passwords and replace damaged files.');
  });
});
