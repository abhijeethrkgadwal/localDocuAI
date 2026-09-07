import {
  CommandName,
  createCommandRegistry,
  err,
  ok,
  unsupportedError,
  type CommandDefinition,
  type CommandName as CommandNameType,
  type CommandRegistry,
  type Result,
} from '@localdoc/core';
import {
  copyFilesCommand,
  createFolderCommand,
  filterFilesCommand,
  moveFilesCommand,
  renameFilesCommand,
  sortFilesCommand,
} from '@localdoc/filesystem';
import {
  deletePagesCommand,
  extractPagesCommand,
  mergeFilesCommand,
  reorderPagesCommand,
  rotatePagesCommand,
  splitFileCommand,
} from '@localdoc/pdf';
import { COMMAND_CATALOG, isAiSelectableCommand } from './catalog.js';

/**
 * Unified application command registry.
 *
 * MERGE_FILES is registered once (PDF schemas). DOCX merge is selected at
 * execution time by file type in the web/desktop shell — see catalog engines.
 *
 * Adapter-bound file commands expose schemas for validation/AI; some execute
 * paths require the shell to call adapter-aware helpers.
 */
export function createAppCommandRegistry(): CommandRegistry {
  const commands: CommandDefinition<unknown, unknown>[] = [
    mergeFilesCommand as CommandDefinition<unknown, unknown>,
    splitFileCommand as CommandDefinition<unknown, unknown>,
    extractPagesCommand as CommandDefinition<unknown, unknown>,
    deletePagesCommand as CommandDefinition<unknown, unknown>,
    rotatePagesCommand as CommandDefinition<unknown, unknown>,
    reorderPagesCommand as CommandDefinition<unknown, unknown>,
    sortFilesCommand as CommandDefinition<unknown, unknown>,
    filterFilesCommand as CommandDefinition<unknown, unknown>,
    renameFilesCommand as CommandDefinition<unknown, unknown>,
    copyFilesCommand as CommandDefinition<unknown, unknown>,
    moveFilesCommand as CommandDefinition<unknown, unknown>,
    createFolderCommand as CommandDefinition<unknown, unknown>,
  ];

  return createCommandRegistry(commands);
}

/** Singleton for shells that share one registry instance. */
export const appCommandRegistry = createAppCommandRegistry();

export function listRegisteredCommandNames(
  registry: CommandRegistry = appCommandRegistry,
): CommandNameType[] {
  return registry.list().map((c) => c.name);
}

/**
 * Validate that a proposed command name is registered and AI-selectable.
 * Used by the future interpreter before any filesystem work.
 */
export function assertCommandAllowed(name: string): Result<CommandNameType> {
  if (!isAiSelectableCommand(name)) {
    return err(
      unsupportedError(
        `Unsupported or unknown command: ${name}`,
        'Choose an operation from the supported command list.',
      ),
    );
  }
  if (!appCommandRegistry.has(name)) {
    return err(
      unsupportedError(
        `Command is catalogued but not registered: ${name}`,
        'This capability is not wired for execution yet.',
      ),
    );
  }
  return ok(name);
}

/** Ensure registry coverage matches the catalog of available commands. */
export function assertRegistryMatchesCatalog(
  registry: CommandRegistry = appCommandRegistry,
): Result<void> {
  const available = COMMAND_CATALOG.filter((e) => e.status === 'available' || e.status === 'partial');
  const missing = available.filter((e) => !registry.has(e.name)).map((e) => e.name);
  if (missing.length) {
    return err(
      unsupportedError(
        `Registry missing catalogued commands: ${missing.join(', ')}`,
        'Register the missing command handlers.',
      ),
    );
  }

  // Every CommandName enum value should appear in the catalog.
  const catalogNames = new Set(COMMAND_CATALOG.map((e) => e.name));
  const enumMissing = Object.values(CommandName).filter((n) => !catalogNames.has(n));
  if (enumMissing.length) {
    return err(
      unsupportedError(
        `Catalog missing CommandName entries: ${enumMissing.join(', ')}`,
        'Add catalog metadata for each command name.',
      ),
    );
  }

  return ok(undefined);
}
