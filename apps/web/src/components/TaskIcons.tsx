import type { ReactNode } from 'react';

export type TaskIconId =
  | 'merge'
  | 'split'
  | 'extract'
  | 'delete'
  | 'rotate'
  | 'reorder'
  | 'compress'
  | 'wordToPdf'
  | 'mergeWord'
  | 'allTools'
  | 'chat'
  | 'summarize'
  | 'ocr';

function IconBase({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const ICON_PATHS: Record<TaskIconId, ReactNode> = {
  merge: (
    <>
      <path d="M8 3H5a1 1 0 00-1 1v12a1 1 0 001 1h3" />
      <path d="M16 3h3a1 1 0 011 1v12a1 1 0 01-1 1h-3" />
      <path d="M8 10h8" />
      <path d="M13 7l3 3-3 3" />
      <path d="M12 17v4" />
      <path d="M9 21h6" />
    </>
  ),
  split: (
    <>
      <rect x="3" y="4" width="7" height="16" rx="1" />
      <rect x="14" y="4" width="7" height="16" rx="1" />
      <path d="M12 2v20" strokeDasharray="2 2.5" />
    </>
  ),
  extract: (
    <>
      <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 11v6" />
      <path d="M9.5 14.5L12 17l2.5-2.5" />
    </>
  ),
  delete: (
    <>
      <path d="M4 7h16" />
      <path d="M10 3h4a1 1 0 011 1v3H9V4a1 1 0 011-1z" />
      <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 12a8 8 0 11-2.34-5.66" />
      <path d="M20 4v4h-4" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </>
  ),
  reorder: (
    <>
      <rect x="3" y="4" width="10" height="6" rx="1" />
      <rect x="3" y="14" width="10" height="6" rx="1" />
      <path d="M18 4v16" />
      <path d="M15.5 6.5L18 4l2.5 2.5" />
      <path d="M15.5 17.5L18 20l2.5-2.5" />
    </>
  ),
  compress: (
    <>
      <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 10.5L12 13l2.5-2.5" />
      <path d="M9.5 18.5L12 16l2.5 2.5" />
    </>
  ),
  wordToPdf: (
    <>
      <path d="M9 3H4a1 1 0 00-1 1v12a1 1 0 001 1h5" />
      <path d="M5.5 7l1 5 1.5-3.5L9.5 12l1-5" />
      <path d="M15 7h5a1 1 0 011 1v12a1 1 0 01-1 1h-6a1 1 0 01-1-1v-3" />
      <path d="M12 12h5" />
      <path d="M15 10l2 2-2 2" />
    </>
  ),
  mergeWord: (
    <>
      <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" />
      <path d="M14 3v5h5" />
      <path d="M8 11l1.25 6L12 12.5 14.75 17 16 11" />
    </>
  ),
  allTools: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1.25" />
      <rect x="14" y="4" width="6" height="6" rx="1.25" />
      <rect x="4" y="14" width="6" height="6" rx="1.25" />
      <rect x="14" y="14" width="6" height="6" rx="1.25" />
    </>
  ),
  chat: (
    <>
      <path d="M20 12a8 8 0 01-11.6 7.14L4 20l.86-4.4A8 8 0 1120 12z" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14.5h4" />
    </>
  ),
  summarize: (
    <>
      <path d="M4 6h16" />
      <path d="M4 10h16" />
      <path d="M4 14h9" />
      <path d="M4 18h6" />
      <path d="M18 14l.9 1.9 1.9.9-1.9.9L18 19.6l-.9-1.9-1.9-.9 1.9-.9z" />
    </>
  ),
  ocr: (
    <>
      <path d="M4 8V5a1 1 0 011-1h3" />
      <path d="M16 4h3a1 1 0 011 1v3" />
      <path d="M20 16v3a1 1 0 01-1 1h-3" />
      <path d="M8 20H5a1 1 0 01-1-1v-3" />
      <path d="M9 9h6" />
      <path d="M12 9v7" />
    </>
  ),
};

export function TaskIcon({ id, size }: { id: TaskIconId; size?: number }) {
  return <IconBase size={size}>{ICON_PATHS[id]}</IconBase>;
}
