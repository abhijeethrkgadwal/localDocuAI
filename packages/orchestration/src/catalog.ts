import {
  CommandName,
  Permission,
  SupportedFileType,
  type CommandName as CommandNameType,
  type Permission as PermissionType,
  type SupportedFileType as SupportedFileTypeType,
} from '@localdoc/core';

/**
 * AI-safe command catalog entry.
 * Contains only metadata — never execution handlers or document bytes.
 */
export interface CommandCatalogEntry {
  name: CommandNameType;
  description: string;
  requiredPermissions: readonly PermissionType[];
  supportedFileTypes: readonly SupportedFileTypeType[];
  /** Engines that implement this intent (e.g. merge has pdf + docx). */
  engines: readonly string[];
  /** True when the command is available for AI planning. */
  aiSelectable: boolean;
  status: 'available' | 'partial' | 'planned';
  notes?: string;
}

/** Full product catalog for implemented + noted commands. */
export const COMMAND_CATALOG: readonly CommandCatalogEntry[] = [
  {
    name: CommandName.MERGE_FILES,
    description: 'Merge multiple files of the same type into one output.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF, SupportedFileType.DOCX],
    engines: ['pdf', 'docx'],
    aiSelectable: true,
    status: 'available',
    notes: 'PDF uses pdf-lib; DOCX uses practical body-append merge (not Word-perfect).',
  },
  {
    name: CommandName.SPLIT_FILE,
    description: 'Split a PDF into one file per page.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.EXTRACT_PAGES,
    description: 'Extract selected pages from a PDF into a new PDF.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.DELETE_PAGES,
    description: 'Delete selected pages from a PDF.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.REORDER_PAGES,
    description: 'Reorder all pages of a PDF.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.ROTATE_PAGES,
    description: 'Rotate selected or all PDF pages by 90/180/270 degrees.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.COMPRESS_PDF,
    description:
      'Compress a PDF locally by recompressing embedded images or rasterizing pages.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.PDF],
    engines: ['pdf'],
    aiSelectable: true,
    status: 'partial',
    notes:
      'Web: balanced image recompression + optional maximum page rasterization (pdf.js). Deeper engines planned for desktop.',
  },
  {
    name: CommandName.CONVERT_TO_PDF,
    description:
      'Convert a DOC or DOCX file to a simple local PDF when device capacity allows.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.DOCX, SupportedFileType.DOC],
    engines: ['docx'],
    aiSelectable: true,
    status: 'partial',
    notes:
      'Web: capacity-gated simple text PDF. Layout fidelity is limited; heavy jobs deferred to desktop (coming soon).',
  },
  {
    name: CommandName.SORT_FILES,
    description: 'Sort files by natural name, alphabetical order, or modified time.',
    requiredPermissions: [Permission.READ_FILES],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.FILTER_FILES,
    description: 'Filter files by name query and/or extension.',
    requiredPermissions: [Permission.READ_FILES],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.RENAME_FILES,
    description: 'Bulk-rename files in the local session using a pattern.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'available',
    notes: 'Browser session rename; native disk rename arrives with desktop.',
  },
  {
    name: CommandName.COPY_FILES,
    description: 'Duplicate files in the local session.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'available',
  },
  {
    name: CommandName.MOVE_FILES,
    description: 'Update session paths to a destination folder label.',
    requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'partial',
    notes: 'Session path update today; native disk move on desktop later.',
  },
  {
    name: CommandName.CREATE_FOLDER,
    description: 'Create a subfolder under a previously selected directory.',
    requiredPermissions: [Permission.WRITE_FILES, Permission.LIST_DIRECTORY],
    supportedFileTypes: [SupportedFileType.ANY],
    engines: ['filesystem'],
    aiSelectable: true,
    status: 'available',
    notes: 'Requires Chromium folder access.',
  },
] as const;

export function getCatalogEntry(name: CommandNameType): CommandCatalogEntry | undefined {
  return COMMAND_CATALOG.find((entry) => entry.name === name);
}

/** Names the AI may select — never invent outside this set. */
export function listAiSelectableCommands(): CommandNameType[] {
  return COMMAND_CATALOG.filter((e) => e.aiSelectable).map((e) => e.name);
}

export function isAiSelectableCommand(name: string): name is CommandNameType {
  return COMMAND_CATALOG.some((e) => e.aiSelectable && e.name === name);
}
