import type { TaskIconId } from '../components/TaskIcons';
import { SITE_PATHS } from './siteConfig';

export type TaskCategory = 'organize' | 'optimize' | 'convert' | 'ai';

export const TASK_CATEGORIES: readonly TaskCategory[] = ['organize', 'optimize', 'convert', 'ai'];

export interface TaskTile {
  /** Key under common.tasks.items.* for title / desc. */
  id: string;
  path: string;
  category: TaskCategory;
  icon: TaskIconId;
  status: 'available' | 'comingSoon';
}

export const TASK_TILES: readonly TaskTile[] = [
  { id: 'mergePdf', path: SITE_PATHS.mergePdf, category: 'organize', icon: 'merge', status: 'available' },
  { id: 'splitPdf', path: SITE_PATHS.splitPdf, category: 'organize', icon: 'split', status: 'available' },
  { id: 'compressPdf', path: SITE_PATHS.compressPdf, category: 'optimize', icon: 'compress', status: 'available' },
  { id: 'docxToPdf', path: SITE_PATHS.docxToPdf, category: 'convert', icon: 'wordToPdf', status: 'available' },
  { id: 'extractPages', path: SITE_PATHS.extractPages, category: 'organize', icon: 'extract', status: 'available' },
  { id: 'deletePages', path: SITE_PATHS.deletePages, category: 'organize', icon: 'delete', status: 'available' },
  { id: 'rotatePdf', path: SITE_PATHS.rotatePdf, category: 'organize', icon: 'rotate', status: 'available' },
  { id: 'reorderPages', path: SITE_PATHS.reorderPages, category: 'organize', icon: 'reorder', status: 'available' },
  { id: 'mergeDocx', path: SITE_PATHS.mergeDocx, category: 'organize', icon: 'mergeWord', status: 'available' },
  { id: 'chatPdf', path: SITE_PATHS.localAi, category: 'ai', icon: 'chat', status: 'comingSoon' },
  { id: 'summarize', path: SITE_PATHS.localAi, category: 'ai', icon: 'summarize', status: 'comingSoon' },
  { id: 'ocr', path: SITE_PATHS.localAi, category: 'ai', icon: 'ocr', status: 'comingSoon' },
];
