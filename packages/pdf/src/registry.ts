import { createCommandRegistry, type CommandDefinition } from '@localdoc/core';
import { compressPdfCommand } from './compress.js';
import { deletePagesCommand } from './delete-pages.js';
import { extractPagesCommand } from './extract.js';
import { mergeFilesCommand } from './merge.js';
import { reorderPagesCommand } from './reorder.js';
import { rotatePagesCommand } from './rotate.js';
import { splitFileCommand } from './split.js';

const commands = [
  mergeFilesCommand,
  splitFileCommand,
  extractPagesCommand,
  deletePagesCommand,
  rotatePagesCommand,
  reorderPagesCommand,
  compressPdfCommand,
] as CommandDefinition<unknown, unknown>[];

/** PDF command registry (Phase 1–2 surface). */
export const pdfCommandRegistry = createCommandRegistry(commands);

/** @deprecated Use pdfCommandRegistry */
export const phase1CommandRegistry = pdfCommandRegistry;
