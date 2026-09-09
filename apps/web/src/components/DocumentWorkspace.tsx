import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import {
  SortingType,
  formatAppErrorLine,
  isPdfFile,
  isWordFile,
  type LocalFileRef,
  type ProgressUpdate,
  type SortingSpec,
} from '@localdoc/core';
import {
  DOCUMENT_ACCEPT,
  DOC_ACCEPT,
  DOCX_ACCEPT,
  PDF_ACCEPT,
  canPickFolder,
  createBrowserFilesystemAdapter,
  describeCapabilities,
  executeCopyFiles,
  executeCreateFolder,
  executeMoveFiles,
  executeRenameFiles,
  readAllBytes,
} from '@localdoc/filesystem';
import { COMMAND_CATALOG, listAiSelectableCommands } from '@localdoc/orchestration/catalog';
import {
  CompressMode,
  CompressQuality,
  type CompressMode as CompressModeType,
  type CompressQuality as CompressQualityType,
} from '@localdoc/pdf/compress-presets';
import { useShallow } from 'zustand/react/shallow';
import { FileList } from './FileList';
import { FileManagePanel, type FileManageBusyAction } from './FileManagePanel';
import { PdfOpsPanel, type PdfAction } from './PdfOpsPanel';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  buildRefreshGuardMessage,
  useRefreshGuard,
} from '../hooks/useRefreshGuard';
import { useT, type TranslateFn } from '../i18n';
import { createBusyLock } from '../lib/busyLock';
import {
  getCompressCapacityHint,
  getConvertCapacityHint,
  prefersTouchFirstUi,
} from '../lib/deviceCapacityHint';
import { createThrottledProgress } from '../lib/progressThrottle';
import type { PdfOpKind } from '../lib/pdfOpsWorkflow';
import type { FileAcceptKind } from '../lib/toolPageConfig';
import { useWorkspaceStore } from '../store';

/** Below-the-fold preview — keep pdf/docx engines out of the initial shell. */
const DocumentPreview = lazy(() =>
  import('./DocumentPreview').then((m) => ({ default: m.DocumentPreview })),
);

const READY_COMMAND_COUNT = COMMAND_CATALOG.filter(
  (e) => e.status === 'available' || e.status === 'partial',
).length;
const AI_SELECTABLE_COUNT = listAiSelectableCommands().length;

export interface DocumentWorkspaceProps {
  allowedActions?: PdfAction[];
  /** When true, lock to the first allowed action and hide the picker. */
  lockAction?: boolean;
  acceptKind?: FileAcceptKind;
  showFileManage?: boolean;
  showAiPlaceholder?: boolean;
  folderExtensions?: string[];
  workspaceHeading?: string;
  opsTitle?: string;
  opsDesc?: string;
  /** Starting action when the panel mounts / mode changes. */
  initialAction?: PdfAction;
}

function acceptMap(kind: FileAcceptKind): Record<string, string[]> {
  if (kind === 'pdf') return PDF_ACCEPT;
  if (kind === 'word') return { ...DOCX_ACCEPT, ...DOC_ACCEPT };
  return DOCUMENT_ACCEPT;
}

function matchesAccept(
  file: { name: string; mimeType?: string },
  kind: FileAcceptKind,
): boolean {
  if (kind === 'pdf') return isPdfFile(file);
  if (kind === 'word') return isWordFile(file);
  return isPdfFile(file) || isWordFile(file);
}

function formatLabel(kind: FileAcceptKind, t: TranslateFn): string {
  if (kind === 'pdf') return t('workspace.formats.pdf');
  if (kind === 'word') return t('workspace.formats.word');
  return t('workspace.formats.document');
}

function defaultAction(allowed: PdfAction[] | undefined, initial?: PdfAction): PdfAction {
  if (initial && (!allowed || allowed.includes(initial))) return initial;
  if (allowed && allowed.length > 0) return allowed[0]!;
  return 'merge';
}

export function DocumentWorkspace({
  allowedActions,
  lockAction = false,
  acceptKind = 'document',
  showFileManage = true,
  showAiPlaceholder = true,
  folderExtensions = ['pdf', 'docx', 'doc'],
  workspaceHeading,
  opsTitle,
  opsDesc,
  initialAction,
}: DocumentWorkspaceProps) {
  const t = useT();
  const fs = useMemo(() => createBrowserFilesystemAdapter(), []);
  const fileAccept = useMemo(() => acceptMap(acceptKind), [acceptKind]);
  const formatCopy = formatLabel(acceptKind, t);
  const resolvedHeading = workspaceHeading ?? t('workspace.config.full.workspaceHeading');

  const {
    files,
    sessionFiles,
    selectedId,
    directoryId,
    directoryName,
    filterQuery: activeFilter,
    setFiles,
    appendFiles,
    setDirectory,
    reorder,
    removeFile,
    selectFile,
    replaceFiles,
    applySort,
    applyFilter,
    clearFilter,
    clear,
  } = useWorkspaceStore(
    useShallow((s) => ({
      files: s.files,
      sessionFiles: s.sessionFiles,
      selectedId: s.selectedId,
      directoryId: s.directoryId,
      directoryName: s.directoryName,
      filterQuery: s.filterQuery,
      setFiles: s.setFiles,
      appendFiles: s.appendFiles,
      setDirectory: s.setDirectory,
      reorder: s.reorder,
      removeFile: s.removeFile,
      selectFile: s.selectFile,
      replaceFiles: s.replaceFiles,
      applySort: s.applySort,
      applyFilter: s.applyFilter,
      clearFilter: s.clearFilter,
      clear: s.clear,
    })),
  );

  const [status, setStatus] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [picking, setPicking] = useState(false);

  const [action, setAction] = useState<PdfAction>(() =>
    defaultAction(allowedActions, initialAction),
  );
  const [pageSpec, setPageSpec] = useState('');
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [orderSpec, setOrderSpec] = useState('');
  const [compressQuality, setCompressQuality] = useState<CompressQualityType>(CompressQuality.MEDIUM);
  const [compressMode, setCompressMode] = useState<CompressModeType>(CompressMode.BALANCED);

  const [sortType, setSortType] = useState<string>(SortingType.NATURAL_FILENAME);
  const [filterQuery, setFilterQuery] = useState('');
  const [renamePattern, setRenamePattern] = useState('{name}_{nn}');
  const [moveDestination, setMoveDestination] = useState('archive');
  const [folderName, setFolderName] = useState('exports');
  const [fileManageStatus, setFileManageStatus] = useState<string | null>(null);
  const [fileManageError, setFileManageError] = useState<string | null>(null);
  const [fileManageBusy, setFileManageBusy] = useState<FileManageBusyAction | null>(null);
  const [fileManageProgress, setFileManageProgress] = useState<ProgressUpdate | null>(null);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<string | null>(null);
  const [affectedFiles, setAffectedFiles] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  /** Sync lock so rapid clicks cannot start a second task before React re-renders. */
  const busyLockRef = useRef(createBusyLock());

  const capabilityCopy = useMemo(() => describeCapabilities(fs.capabilities), [fs]);
  const folderPickAvailable = canPickFolder(fs.capabilities);
  const touchFirst = useMemo(() => prefersTouchFirstUi(), []);
  const selectedFile = files.find((f) => f.id === selectedId) ?? null;
  /** Keep list selection snappy while preview bytes catch up. */
  const deferredPreviewFile = useDeferredValue(selectedFile);
  const canCreateFolder = Boolean(directoryId) && fs.capabilities.supportsCreateFolder;
  const workspaceBusy = running || picking || fileManageBusy !== null;
  const online = useOnlineStatus();
  const refreshGuardEnabled = !online || workspaceBusy;
  const refreshGuardMessage = useMemo(
    () => buildRefreshGuardMessage({ offline: !online, busy: workspaceBusy, t }),
    [online, workspaceBusy, t],
  );
  useRefreshGuard({ enabled: refreshGuardEnabled, confirmMessage: refreshGuardMessage });

  useEffect(() => {
    const next = defaultAction(allowedActions, initialAction);
    setAction((current) => {
      if (allowedActions && !allowedActions.includes(current)) return next;
      if (lockAction) return next;
      return current;
    });
  }, [allowedActions, initialAction, lockAction]);

  // Warm heavy engines in the background once the user has documents — keeps Run snappy
  // without paying pdf-lib / jszip cost on first paint.
  useEffect(() => {
    if (sessionFiles.length === 0) return;
    const warm = () => {
      void import('../lib/mergeWorkflow');
      void import('../lib/pdfOpsWorkflow');
      void import('../lib/convertWorkflow');
      void import('./DocumentPreview');
    };

    const idleId = window.requestIdleCallback(warm, { timeout: 2500 });
    return () => window.cancelIdleCallback(idleId);
  }, [sessionFiles.length]);

  const canRun =
    !workspaceBusy &&
    (action === 'merge'
      ? files.length >= 2
      : action === 'convertToPdf'
        ? selectedFile !== null && isWordFile(selectedFile)
        : selectedFile !== null && isPdfFile(selectedFile));

  const mergeNeedCopy =
    acceptKind === 'pdf'
      ? t('workspace.disabled.mergeNeedPdf')
      : acceptKind === 'word'
        ? t('workspace.disabled.mergeNeedWord')
        : t('workspace.disabled.mergeNeedSameType');

  const disabledReason = !canRun
    ? workspaceBusy
      ? picking
        ? t('workspace.busy.waitFileSelection')
        : fileManageBusy
          ? t('workspace.busy.waitOrganize')
          : t('workspace.busy.waitCurrentOp')
      : action === 'merge'
        ? files.length < 2
          ? mergeNeedCopy
          : null
        : action === 'convertToPdf'
          ? !selectedFile
            ? t('workspace.disabled.selectWordFirst')
            : !isWordFile(selectedFile)
              ? t('workspace.disabled.convertWordOnly')
              : null
          : !selectedFile
            ? t('workspace.disabled.selectPdfFirst')
            : !isPdfFile(selectedFile)
              ? action === 'compress'
                ? t('workspace.disabled.compressPdfOnly')
                : t('workspace.disabled.pageOpsPdfOnly')
              : null
    : null;

  const hint =
    action === 'merge'
      ? lockAction
        ? t('workspace.hints.mergeLocked', { format: formatCopy })
        : t('workspace.hints.mergeOpen', {
            readyCount: READY_COMMAND_COUNT,
            aiCount: AI_SELECTABLE_COUNT,
          })
      : action === 'convertToPdf'
        ? t('workspace.hints.convert')
        : action === 'compress'
          ? t('workspace.hints.compress')
          : t('workspace.hints.pageOps');

  const capacityBanner =
    action === 'convertToPdf'
      ? getConvertCapacityHint(t)
      : action === 'compress'
        ? getCompressCapacityHint(t)
        : null;

  function tryAcquireBusy(): boolean {
    return busyLockRef.current.tryAcquire();
  }

  function releaseBusy() {
    busyLockRef.current.release();
  }

  function patchSessionFromVisible(updatedVisible: LocalFileRef[]) {
    const byId = new Map(updatedVisible.map((f) => [f.id, f]));
    replaceFiles(sessionFiles.map((f) => byId.get(f.id) ?? f));
  }

  async function pickFiles() {
    if (!tryAcquireBusy()) return;
    setPickError(null);
    setPicking(true);
    try {
      const result = await fs.pickFiles({ multiple: true, accept: fileAccept });
      if (!result.ok) {
        if (result.error.category !== 'cancelled') {
          setPickError(formatAppErrorLine(result.error));
        } else {
          setStatus(t('workspace.pick.fileSelectionCancelled'));
        }
        return;
      }
      setDirectory(null);
      const docs = result.value.filter((f) => matchesAccept(f, acceptKind));
      const ignored = result.value.length - docs.length;
      setFiles(docs);
      if (!docs.length) {
        setStatus(
          ignored > 0
            ? t('workspace.pick.noFormatSelected', { format: formatCopy, ignored })
            : t('workspace.pick.noDocumentsSelected'),
        );
        return;
      }
      setStatus(
        ignored > 0
          ? t('workspace.pick.documentsSelectedIgnored', {
              count: docs.length,
              ignored,
            })
          : t('workspace.pick.documentsSelected', { count: docs.length }),
      );
    } finally {
      setPicking(false);
      releaseBusy();
    }
  }

  async function pickFolder() {
    if (!tryAcquireBusy()) return;
    setPickError(null);
    setPicking(true);
    try {
      const result = await fs.pickDirectory({
        recursive: true,
        extensions: folderExtensions,
      });
      if (!result.ok) {
        if (result.error.category !== 'cancelled') {
          setPickError(formatAppErrorLine(result.error));
        } else {
          setStatus(t('workspace.pick.folderSelectionCancelled'));
        }
        return;
      }
      setDirectory(result.value.directory.id || null, result.value.directory.name);
      const docs = result.value.files.filter((f) => matchesAccept(f, acceptKind));
      setFiles(docs);
      setStatus(
        docs.length
          ? t('workspace.pick.documentsDiscovered', {
              count: docs.length,
              name: result.value.directory.name,
            })
          : t('workspace.pick.noFormatInFolder', {
              format: formatCopy,
              name: result.value.directory.name,
            }),
      );
    } finally {
      setPicking(false);
      releaseBusy();
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDropActive(false);
    if (workspaceBusy || busyLockRef.current.isLocked()) {
      setPickError(t('workspace.pick.waitBeforeDrop'));
      return;
    }
    setPickError(null);
    const allDropped = Array.from(event.dataTransfer.files);
    const dropped = allDropped.filter((f) => matchesAccept(f, acceptKind));
    if (!dropped.length) {
      setPickError(t('workspace.pick.dropFormatOnly', { format: formatCopy }));
      return;
    }
    const result = fs.registerFiles(dropped);
    if (!result.ok) {
      setPickError(formatAppErrorLine(result.error));
      return;
    }
    setDirectory(null);
    const ignored = allDropped.length - dropped.length;
    const note =
      ignored > 0 ? t('workspace.pick.ignoredNote', { ignored }) : '';
    if (files.length > 0) {
      appendFiles(result.value, false);
      setStatus(
        t('workspace.pick.appendedFromDrop', { count: result.value.length, note }),
      );
    } else {
      setFiles(result.value);
      setStatus(t('workspace.pick.loadedFromDrop', { count: result.value.length, note }));
    }
  }

  function resetOpMessages() {
    setResultMessage(null);
    setErrorMessage(null);
    setRecovery(null);
    setErrorCategory(null);
    setAffectedFiles([]);
  }

  function applyWorkflowFailure(error: {
    message: string;
    category: string;
    recovery: string | null;
    affectedFiles: string[];
  }) {
    if (error.category === 'cancelled') {
      setResultMessage(error.message || t('workspace.status.cancelledNothingChanged'));
      setStatus(t('workspace.status.cancelledNothingOnDisk'));
      return;
    }
    setErrorMessage(error.message);
    setRecovery(error.recovery);
    setErrorCategory(error.category);
    setAffectedFiles(error.affectedFiles);
  }

  async function runOp() {
    if (!tryAcquireBusy()) return;
    resetOpMessages();
    setRunning(true);
    setProgress({
      operation: action,
      filesProcessed: 0,
      totalFiles: action === 'merge' ? files.length : 1,
      fraction: 0,
      message: t('workspace.status.starting'),
    });

    const controller = new AbortController();
    abortRef.current = controller;
    const onProgress = createThrottledProgress(setProgress);

    try {
      if (action === 'merge') {
        const { runLocalDocumentMerge } = await import('../lib/mergeWorkflow');
        const result = await runLocalDocumentMerge(fs, files, {
          signal: controller.signal,
          onProgress,
        });
        if (!result.ok) {
          applyWorkflowFailure(result.error);
          return;
        }
        setResultMessage(result.value.message);
        setStatus(t('workspace.status.mergeCompleted'));
        return;
      }

      if (action === 'convertToPdf') {
        if (!selectedFile || !isWordFile(selectedFile)) {
          setErrorMessage(t('workspace.status.convertRequiresWord'));
          setRecovery(t('workspace.status.convertRecovery'));
          setErrorCategory('validation');
          return;
        }
        const { runLocalWordToPdf } = await import('../lib/convertWorkflow');
        const result = await runLocalWordToPdf(fs, selectedFile, {
          signal: controller.signal,
          onProgress,
        });
        if (!result.ok) {
          applyWorkflowFailure(result.error);
          return;
        }
        setResultMessage(result.value.message);
        setStatus(t('workspace.status.conversionCompleted'));
        return;
      }

      if (!selectedFile || !isPdfFile(selectedFile)) {
        setErrorMessage(t('workspace.status.pageOpsRequirePdf'));
        setRecovery(t('workspace.status.pageOpsRecovery'));
        setErrorCategory('validation');
        return;
      }

      const { runSinglePdfOp } = await import('../lib/pdfOpsWorkflow');
      const result = await runSinglePdfOp(fs, selectedFile, action as PdfOpKind, {
        signal: controller.signal,
        onProgress,
        pageSpec,
        rotation,
        orderSpec,
        compressQuality,
        compressMode,
      });

      if (!result.ok) {
        applyWorkflowFailure(result.error);
        return;
      }

      setResultMessage(result.value.message);
      setStatus(t('workspace.status.operationCompleted'));
    } finally {
      setRunning(false);
      setProgress(null);
      abortRef.current = null;
      releaseBusy();
    }
  }

  async function runFileManage(
    actionName: FileManageBusyAction,
    work: (onProgress: (update: ProgressUpdate) => void) => Promise<void>,
  ) {
    if (!tryAcquireBusy()) return;
    setFileManageError(null);
    setFileManageStatus(null);
    setFileManageBusy(actionName);
    setFileManageProgress(null);
    try {
      await work(setFileManageProgress);
    } finally {
      setFileManageBusy(null);
      setFileManageProgress(null);
      releaseBusy();
    }
  }

  async function runRename() {
    await runFileManage('rename', async () => {
      const result = await executeRenameFiles(
        { files, pattern: renamePattern },
        undefined,
        fs,
      );
      if (!result.ok) {
        setFileManageError(formatAppErrorLine(result.error));
        return;
      }
      patchSessionFromVisible(result.value.files);
      setFileManageStatus(
        t('workspace.fileManage.renamed', { count: result.value.renamedCount }),
      );
    });
  }

  async function runCopy() {
    await runFileManage('copy', async () => {
      const result = await executeCopyFiles({ files }, undefined, fs);
      if (!result.ok) {
        setFileManageError(formatAppErrorLine(result.error));
        return;
      }
      appendFiles(result.value.files, false);
      setFileManageStatus(
        t('workspace.fileManage.duplicated', { count: result.value.copiedCount }),
      );
    });
  }

  async function runMove() {
    await runFileManage('move', async () => {
      const result = await executeMoveFiles({ files, destination: moveDestination });
      if (!result.ok) {
        setFileManageError(formatAppErrorLine(result.error));
        return;
      }
      patchSessionFromVisible(result.value.files);
      setFileManageStatus(
        t('workspace.fileManage.movedSession', {
          count: result.value.movedCount,
          destination: moveDestination,
        }),
      );
    });
  }

  async function runCreateFolder() {
    await runFileManage('createFolder', async () => {
      if (!directoryId) {
        setFileManageError(t('workspace.fileManage.selectFolderFirst'));
        return;
      }
      const result = await executeCreateFolder(
        { parentDirectoryId: directoryId, folderName },
        undefined,
        fs,
      );
      if (!result.ok) {
        setFileManageError(formatAppErrorLine(result.error));
        return;
      }
      setFileManageStatus(
        t('workspace.fileManage.createdFolder', { name: result.value.directory.name }),
      );
    });
  }

  async function runExportAll() {
    await runFileManage('export', async (onProgress) => {
      const total = files.length;
      onProgress({
        operation: 'export',
        filesProcessed: 0,
        totalFiles: Math.max(total, 1),
        fraction: 0,
        message: t('workspace.fileManage.readingFiles'),
      });
      const read = await readAllBytes(fs, files);
      if (!read.ok) {
        setFileManageError(formatAppErrorLine(read.error));
        return;
      }
      let saved = 0;
      for (const file of read.value) {
        onProgress({
          operation: 'export',
          filesProcessed: saved,
          totalFiles: read.value.length,
          fraction: read.value.length ? saved / read.value.length : 0,
          message: t('workspace.fileManage.savingFile', { name: file.name }),
        });
        const written = await fs.writeBytes(file.bytes, { suggestedName: file.name });
        if (!written.ok) {
          setFileManageError(
            saved > 0
              ? t('workspace.fileManage.exportedPartialFail', {
                  saved,
                  total: read.value.length,
                  error: formatAppErrorLine(written.error),
                })
              : formatAppErrorLine(written.error),
          );
          return;
        }
        saved += 1;
        onProgress({
          operation: 'export',
          filesProcessed: saved,
          totalFiles: read.value.length,
          fraction: read.value.length ? saved / read.value.length : 1,
          message:
            written.value.method === 'download'
              ? t('workspace.fileManage.downloadedFile', { name: file.name })
              : t('workspace.fileManage.savedFile', { name: file.name }),
        });
      }
      setFileManageStatus(
        t('workspace.fileManage.exported', {
          count: saved,
          method: fs.capabilities.supportsWriteToHandle
            ? t('workspace.fileManage.methodSaveDownload')
            : t('workspace.fileManage.methodDownload'),
        }),
      );
    });
  }

  const liveStatus = workspaceBusy
    ? picking
      ? t('workspace.busy.selectingDocuments')
      : running
        ? progress?.message || t('workspace.busy.operationInProgress')
        : fileManageBusy
          ? fileManageProgress?.message || t('workspace.busy.fileManageInProgress')
          : t('workspace.busy.workspaceBusy')
    : status || resultMessage || fileManageStatus || '';

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </div>

      <section
        className="panel"
        aria-labelledby="workspace-heading"
        aria-busy={workspaceBusy}
        onDragOver={(e) => {
          e.preventDefault();
          if (!workspaceBusy) setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onDrop}
      >
        <h2 id="workspace-heading" className="panel-title">
          {resolvedHeading}
        </h2>
        <p className="panel-desc">{capabilityCopy}</p>
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          {t('workspace.pick.processedLocally')}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={workspaceBusy}
            onClick={() => void pickFiles()}
            className="btn btn-primary"
            aria-busy={picking}
          >
            {picking ? t('workspace.pick.selecting') : t('workspace.pick.selectFiles')}
          </button>
          {folderPickAvailable ? (
            <button
              type="button"
              disabled={workspaceBusy}
              onClick={() => void pickFolder()}
              className="btn btn-secondary"
              aria-busy={picking}
              title={
                fs.capabilities.supportsDirectoryPicker
                  ? undefined
                  : t('workspace.pick.folderPickLimitedTitle')
              }
            >
              {picking ? t('workspace.pick.selecting') : t('workspace.pick.selectFolder')}
            </button>
          ) : null}
          <button
            type="button"
            disabled={workspaceBusy || sessionFiles.length === 0}
            onClick={() => {
              clear();
              setStatus(null);
              setPickError(null);
              setFilterQuery('');
              setFileManageStatus(null);
              setFileManageError(null);
              resetOpMessages();
              setProgress(null);
            }}
            className="btn btn-ghost sm:ml-auto"
            aria-label={t('workspace.pick.ariaClearAll')}
          >
            {t('workspace.pick.clear')}
          </button>
        </div>

        {!folderPickAvailable ? (
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            {t('workspace.pick.folderUnavailable')}
          </p>
        ) : null}

        <div
          className="dropzone"
          data-active={dropActive ? 'true' : 'false'}
          role="region"
          aria-label={
            touchFirst
              ? t('workspace.pick.ariaDropzoneTouch', { format: formatCopy })
              : t('workspace.pick.ariaDropzoneDesktop', { format: formatCopy })
          }
        >
          {picking ? (
            <>
              <p className="text-sm font-medium text-[var(--text-primary)]" role="status">
                {t('workspace.pick.selectingDocuments')}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t('workspace.pick.finishOrCancelDialog')}
              </p>
            </>
          ) : files.length === 0 ? (
            <>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('workspace.pick.noDocumentsYet')}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {touchFirst
                  ? t('workspace.pick.emptyTouch', { format: formatCopy })
                  : folderPickAvailable
                    ? t('workspace.pick.emptyWithFolder')
                    : t('workspace.pick.emptyMultiSelect', { format: formatCopy })}
              </p>
              {!touchFirst ? (
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  {t('workspace.pick.orDragDrop', { format: formatCopy })}
                </p>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  {t('workspace.pick.mobileDownloadNote')}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {touchFirst
                  ? t('workspace.pick.addMoreTouch')
                  : t('workspace.pick.orDragDropFiles')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{formatCopy}</p>
            </>
          )}
        </div>

        {status ? (
          <p className="mt-4 text-sm text-[var(--accent)]" role="status">
            {status}
          </p>
        ) : null}
        {pickError ? (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {pickError}
          </p>
        ) : null}

        <FileList
          files={files}
          selectedId={selectedId}
          disabled={workspaceBusy}
          directoryName={directoryName}
          onSelect={selectFile}
          onMoveUp={(index) => reorder(index, index - 1)}
          onMoveDown={(index) => reorder(index, index + 1)}
          onRemove={removeFile}
        />
      </section>

      {showFileManage ? (
        <FileManagePanel
          sortType={sortType}
          onSortTypeChange={setSortType}
          onSort={() => {
            if (workspaceBusy) return;
            applySort({ type: sortType } as SortingSpec);
            setFileManageStatus(t('workspace.fileManage.sorted'));
            setFileManageError(null);
          }}
          filterQuery={filterQuery}
          onFilterQueryChange={setFilterQuery}
          onFilter={() => {
            if (workspaceBusy) return;
            applyFilter(filterQuery);
            const q = filterQuery.trim();
            setFileManageStatus(
              q
                ? t('workspace.fileManage.filterShowing', {
                    query: q,
                    visible: useWorkspaceStore.getState().files.length,
                    session: useWorkspaceStore.getState().sessionFiles.length,
                  })
                : t('workspace.fileManage.filterCleared'),
            );
            setFileManageError(null);
          }}
          onClearFilter={() => {
            if (workspaceBusy) return;
            setFilterQuery('');
            clearFilter();
            setFileManageStatus(t('workspace.fileManage.filterCleared'));
            setFileManageError(null);
          }}
          filterActive={Boolean(activeFilter)}
          renamePattern={renamePattern}
          onRenamePatternChange={setRenamePattern}
          onRename={() => void runRename()}
          onCopy={() => void runCopy()}
          moveDestination={moveDestination}
          onMoveDestinationChange={setMoveDestination}
          onMove={() => void runMove()}
          folderName={folderName}
          onFolderNameChange={setFolderName}
          onCreateFolder={() => void runCreateFolder()}
          canCreateFolder={canCreateFolder}
          directoryLabel={directoryName}
          onExportAll={() => void runExportAll()}
          disabled={workspaceBusy}
          busyAction={fileManageBusy}
          progress={fileManageProgress}
          hasFiles={sessionFiles.length > 0}
          status={fileManageStatus}
          error={fileManageError}
          visibleCount={files.length}
          sessionCount={sessionFiles.length}
        />
      ) : null}

      {capacityBanner ? (
        <p
          className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm ${
            capacityBanner.tone === 'warning'
              ? 'border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
              : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
          }`}
          role="note"
        >
          {capacityBanner.message}
        </p>
      ) : null}

      <PdfOpsPanel
        action={action}
        onActionChange={(next) => {
          if (workspaceBusy || lockAction) return;
          if (allowedActions && !allowedActions.includes(next)) return;
          setAction(next);
          resetOpMessages();
          if (next === 'extract' || next === 'delete') {
            if (!pageSpec.trim()) setPageSpec('1');
          }
          if (next === 'rotate') {
            setPageSpec('');
          }
          if (next === 'reorder' && !orderSpec.trim()) {
            setOrderSpec('');
          }
        }}
        allowedActions={allowedActions}
        showActionPicker={!lockAction}
        showAiPlaceholder={showAiPlaceholder}
        panelTitle={opsTitle}
        panelDesc={opsDesc}
        pageSpec={pageSpec}
        onPageSpecChange={setPageSpec}
        rotation={rotation}
        onRotationChange={setRotation}
        orderSpec={orderSpec}
        onOrderSpecChange={setOrderSpec}
        compressQuality={compressQuality}
        onCompressQualityChange={setCompressQuality}
        compressMode={compressMode}
        onCompressModeChange={setCompressMode}
        canRun={canRun}
        running={running}
        locked={workspaceBusy && !running}
        progress={progress}
        resultMessage={resultMessage}
        errorMessage={errorMessage}
        recovery={recovery}
        errorCategory={errorCategory}
        affectedFiles={affectedFiles}
        hint={hint}
        disabledReason={disabledReason}
        onRun={() => void runOp()}
        onCancel={() => abortRef.current?.abort()}
      />

      <section className="panel" aria-labelledby="preview-heading">
        <h2 id="preview-heading" className="panel-title">
          {t('workspace.preview.title')}
        </h2>
        <p className="panel-desc mb-4">{t('workspace.preview.desc')}</p>
        <Suspense
          fallback={
            <p className="text-sm text-[var(--text-secondary)]" role="status">
              {t('workspace.preview.preparing')}
            </p>
          }
        >
          <DocumentPreview file={deferredPreviewFile} fs={fs} />
        </Suspense>
      </section>
    </>
  );
}
