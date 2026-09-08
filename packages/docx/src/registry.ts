import { createCommandRegistry, type CommandDefinition } from '@localdoc/core';
import { mergeDocxCommand } from './merge.js';
import { convertToPdfCommand } from './to-pdf.js';

/** DOCX handlers. MERGE_FILES / CONVERT_TO_PDF route here from the web shell. */
export const docxCommandRegistry = createCommandRegistry([
  mergeDocxCommand as CommandDefinition<unknown, unknown>,
  convertToPdfCommand as CommandDefinition<unknown, unknown>,
]);
