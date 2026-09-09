import type { PdfAction } from '../components/PdfOpsPanel';
import type { TranslateFn } from '../i18n';
import { SITE_PATHS } from './siteConfig';

/** Tool pages that host a live workspace (not info-only). */
export type ToolPageId =
  | 'merge-pdf'
  | 'merge-docx'
  | 'compress-pdf'
  | 'docx-to-pdf'
  | 'pdf-tools';

export type FileAcceptKind = 'pdf' | 'word' | 'document';

export type WorkspaceCopyKey =
  | 'full'
  | 'mergePdf'
  | 'mergeDocx'
  | 'compressPdf'
  | 'docxToPdf'
  | 'pdfTools';

export interface ToolWorkspaceConfig {
  pageId: ToolPageId;
  path: string;
  allowedActions: PdfAction[];
  /** When true, lock to the first allowed action and hide the picker. */
  lockAction: boolean;
  acceptKind: FileAcceptKind;
  showFileManage: boolean;
  showAiPlaceholder: boolean;
  folderExtensions: string[];
  /** Key under workspace.config.* for headings / ops copy. */
  copyKey: Exclude<WorkspaceCopyKey, 'full'>;
}

const ALL_PDF_TOOL_ACTIONS: PdfAction[] = [
  'merge',
  'compress',
  'split',
  'extract',
  'delete',
  'rotate',
  'reorder',
];

export const TOOL_WORKSPACE_CONFIG: Record<ToolPageId, ToolWorkspaceConfig> = {
  'merge-pdf': {
    pageId: 'merge-pdf',
    path: SITE_PATHS.mergePdf,
    allowedActions: ['merge'],
    lockAction: true,
    acceptKind: 'pdf',
    showFileManage: false,
    showAiPlaceholder: false,
    folderExtensions: ['pdf'],
    copyKey: 'mergePdf',
  },
  'merge-docx': {
    pageId: 'merge-docx',
    path: SITE_PATHS.mergeDocx,
    allowedActions: ['merge'],
    lockAction: true,
    acceptKind: 'word',
    showFileManage: false,
    showAiPlaceholder: false,
    folderExtensions: ['docx', 'doc'],
    copyKey: 'mergeDocx',
  },
  'compress-pdf': {
    pageId: 'compress-pdf',
    path: SITE_PATHS.compressPdf,
    allowedActions: ['compress'],
    lockAction: true,
    acceptKind: 'pdf',
    showFileManage: false,
    showAiPlaceholder: false,
    folderExtensions: ['pdf'],
    copyKey: 'compressPdf',
  },
  'docx-to-pdf': {
    pageId: 'docx-to-pdf',
    path: SITE_PATHS.docxToPdf,
    allowedActions: ['convertToPdf'],
    lockAction: true,
    acceptKind: 'word',
    showFileManage: false,
    showAiPlaceholder: false,
    folderExtensions: ['docx', 'doc'],
    copyKey: 'docxToPdf',
  },
  'pdf-tools': {
    pageId: 'pdf-tools',
    path: SITE_PATHS.pdfTools,
    allowedActions: ALL_PDF_TOOL_ACTIONS,
    lockAction: false,
    acceptKind: 'pdf',
    showFileManage: true,
    showAiPlaceholder: true,
    folderExtensions: ['pdf'],
    copyKey: 'pdfTools',
  },
};

/** Homepage: full document workspace (PDF + Word). */
export const FULL_WORKSPACE_CONFIG = {
  allowedActions: undefined as PdfAction[] | undefined,
  lockAction: false,
  acceptKind: 'document' as FileAcceptKind,
  showFileManage: true,
  showAiPlaceholder: true,
  folderExtensions: ['pdf', 'docx', 'doc'],
  copyKey: 'full' as const,
};

export function resolveToolWorkspaceCopy(pageId: ToolPageId, t: TranslateFn) {
  const key = TOOL_WORKSPACE_CONFIG[pageId].copyKey;
  return {
    workspaceHeading: t(`workspace.config.${key}.workspaceHeading`),
    opsTitle: t(`workspace.config.${key}.opsTitle`),
    opsDesc: t(`workspace.config.${key}.opsDesc`),
  };
}

export function resolveFullWorkspaceCopy(t: TranslateFn) {
  return {
    workspaceHeading: t('workspace.config.full.workspaceHeading'),
    opsTitle: undefined as string | undefined,
    opsDesc: undefined as string | undefined,
  };
}
