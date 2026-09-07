import { createCommandRegistry, type CommandDefinition } from '@localdoc/core';
import { copyFilesCommand } from './copy.js';
import { createFolderCommand } from './create-folder.js';
import { filterFilesCommand } from './filter.js';
import { moveFilesCommand } from './move.js';
import { renameFilesCommand } from './rename.js';
import { sortFilesCommand } from './sort.js';

const commands = [
  sortFilesCommand,
  filterFilesCommand,
  renameFilesCommand,
  copyFilesCommand,
  moveFilesCommand,
  createFolderCommand,
] as CommandDefinition<unknown, unknown>[];

export const fileCommandRegistry = createCommandRegistry(commands);
