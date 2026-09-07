import { createCommandRegistry, type CommandDefinition } from '@localdoc/core';
import { mergeDocxCommand } from './merge.js';

/** DOCX handlers. MERGE_FILES intent for .docx files routes here from the web shell. */
export const docxCommandRegistry = createCommandRegistry([
  mergeDocxCommand as CommandDefinition<unknown, unknown>,
]);
