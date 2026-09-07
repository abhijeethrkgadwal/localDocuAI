export {
  COMMAND_CATALOG,
  getCatalogEntry,
  listAiSelectableCommands,
  isAiSelectableCommand,
  type CommandCatalogEntry,
} from './catalog.js';

export {
  createAppCommandRegistry,
  appCommandRegistry,
  listRegisteredCommandNames,
  assertCommandAllowed,
  assertRegistryMatchesCatalog,
} from './registry.js';
