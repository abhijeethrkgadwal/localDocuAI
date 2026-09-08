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
import { FileList } from './components/FileList';
import { FileManagePanel, type FileManageBusyAction } from './components/FileManagePanel';
import { PdfOpsPanel, type PdfAction } from './components/PdfOpsPanel';
import { DiscoverabilitySections } from './components/DiscoverabilitySections';
import { PublicJsonLd } from './components/PublicJsonLd';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { TrustStatusStrip } from './components/TrustStatusStrip';
import { useTheme } from './hooks/useTheme';
import { createBusyLock } from './lib/busyLock';
import { createThrottledProgress } from './lib/progressThrottle';
import type { PdfOpKind } from './lib/pdfOpsWorkflow';
import { getRouteMeta, applyDocumentMeta } from './lib/routeMeta';
import { SITE, SITE_PATHS } from './lib/siteConfig';
import { useWorkspaceStore } from './store';

/** Below-the-fold preview — keep pdf/docx engines out of the initial shell. */
const DocumentPreview = lazy(() =>
  import('./components/DocumentPreview').then((m) => ({ default: m.DocumentPreview })),
);

const READY_COMMAND_COUNT = COMMAND_CATALOG.filter(
  (e) => e.status === 'available' || e.status === 'partial',
).length;
const AI_SELECTABLE_COUNT = listAiSelectableCommands().length;

export function WorkspacePage() {
  const fs = useMemo(() => createBrowserFilesystemAdapter(), []);
  const { preference, setPreference } = useTheme();
  const homeMeta = getRouteMeta(SITE_PATHS.home);

  useEffect(() => {
    applyDocumentMeta(homeMeta);
  }, [homeMeta]);
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

  const [action, setAction] = useState<PdfAction>('merge');
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
  const selectedFile = files.find((f) => f.id === selectedId) ?? null;
  /** Keep list selection snappy while preview bytes catch up. */
  const deferredPreviewFile = useDeferredValue(selectedFile);
  const canCreateFolder = Boolean(directoryId) && fs.capabilities.supportsCreateFolder;
  const workspaceBusy = running || picking || fileManageBusy !== null;

  // Warm heavy engines in the background once the user has documents — keeps Run snappy
  // without paying pdf-lib / jszip cost on first paint.
  useEffect(() => {
    if (sessionFiles.length === 0) return;
    const warm = () => {
      void import('./lib/mergeWorkflow');
      void import('./lib/pdfOpsWorkflow');
      void import('./lib/convertWorkflow');
      void import('./components/DocumentPreview');
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

  const disabledReason = !canRun
    ? workspaceBusy
      ? picking
        ? 'Wait for file selection to finish.'
        : fileManageBusy
          ? 'Wait for the organize action to finish.'
          : 'Wait for the current operation to finish.'
      : action === 'merge'
        ? files.length < 2
          ? 'Add at least two PDF or DOCX files of the same type to merge.'
          : null
        : action === 'convertToPdf'
          ? !selectedFile
            ? 'Select a DOC or DOCX file in the list first.'
            : !isWordFile(selectedFile)
              ? 'Convert to PDF works on DOC/DOCX only.'
              : null
          : !selectedFile
            ? 'Select a PDF in the list first.'
            : !isPdfFile(selectedFile)
              ? action === 'compress'
                ? 'Compress works on PDFs only.'
                : 'Page operations work on PDFs only. Use Merge or Convert for Word docs.'
              : null
    : null;

  const hint =
    action === 'merge'
      ? `Merge same-type files (PDF or DOCX). ${READY_COMMAND_COUNT} commands ready (${AI_SELECTABLE_COUNT} for LocalDocu AI later).`
      : action === 'convertToPdf'
        ? 'Runs on your device. Large or complex jobs may wait for the desktop app.'
        : action === 'compress'
          ? 'Compress a selected PDF on this device. Balanced keeps text; Maximum shrinks harder.'
          : 'Page ops require a selected PDF. Word docs support merge, convert to PDF, and text preview.';

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
      const result = await fs.pickFiles({ multiple: true, accept: DOCUMENT_ACCEPT });
      if (!result.ok) {
        if (result.error.category !== 'cancelled') {
          setPickError(formatAppErrorLine(result.error));
        } else {
          setStatus('File selection cancelled — your current list is unchanged.');
        }
        return;
      }
      setDirectory(null);
      const docs = result.value.filter((f) => isPdfFile(f) || isWordFile(f));
      const ignored = result.value.length - docs.length;
      setFiles(docs);
      if (!docs.length) {
        setStatus(
          ignored > 0
            ? `No PDF/DOC/DOCX selected (${ignored} unsupported file(s) ignored).`
            : 'No documents selected.',
        );
        return;
      }
      setStatus(
        ignored > 0
          ? `${docs.length} document(s) selected (${ignored} unsupported ignored).`
          : `${docs.length} document(s) selected.`,
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
      const result = await fs.pickDirectory({ recursive: true, extensions: ['pdf', 'docx', 'doc'] });
      if (!result.ok) {
        if (result.error.category !== 'cancelled') {
          setPickError(formatAppErrorLine(result.error));
        } else {
          setStatus('Folder selection cancelled — your current list is unchanged.');
        }
        return;
      }
      setDirectory(result.value.directory.id, result.value.directory.name);
      setFiles(result.value.files);
      setStatus(
        result.value.files.length
          ? `${result.value.files.length} document(s) discovered in “${result.value.directory.name}”.`
          : `No PDF/DOC/DOCX found in “${result.value.directory.name}”.`,
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
      setPickError('Wait for the current task to finish before dropping more files.');
      return;
    }
    setPickError(null);
    const allDropped = Array.from(event.dataTransfer.files);
    const dropped = allDropped.filter((f) => isPdfFile(f) || isWordFile(f));
    if (!dropped.length) {
      setPickError('Drop PDF, DOC, or DOCX files only.');
      return;
    }
    const result = fs.registerFiles(dropped);
    if (!result.ok) {
      setPickError(formatAppErrorLine(result.error));
      return;
    }
    setDirectory(null);
    const ignored = allDropped.length - dropped.length;
    const note = ignored > 0 ? ` (${ignored} unsupported file(s) ignored)` : '';
    if (files.length > 0) {
      appendFiles(result.value, false);
      setStatus(`${result.value.length} document(s) appended from drop${note}.`);
    } else {
      setFiles(result.value);
      setStatus(`${result.value.length} document(s) loaded from drop${note}.`);
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
      setResultMessage(error.message || 'Cancelled — nothing was changed.');
      setStatus('Cancelled — nothing was changed on disk.');
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
      message: 'Starting…',
    });

    const controller = new AbortController();
    abortRef.current = controller;
    const onProgress = createThrottledProgress(setProgress);

    try {
      if (action === 'merge') {
        const { runLocalDocumentMerge } = await import('./lib/mergeWorkflow');
        const result = await runLocalDocumentMerge(fs, files, {
          signal: controller.signal,
          onProgress,
        });
        if (!result.ok) {
          applyWorkflowFailure(result.error);
          return;
        }
        setResultMessage(result.value.message);
        setStatus('Merge completed on this device. Nothing leaves your device for this operation.');
        return;
      }

      if (action === 'convertToPdf') {
        if (!selectedFile || !isWordFile(selectedFile)) {
          setErrorMessage('Convert to PDF requires a selected DOC or DOCX file.');
          setRecovery('Select a Word document, then run Convert DOC/DOCX to PDF.');
          setErrorCategory('validation');
          return;
        }
        const { runLocalWordToPdf } = await import('./lib/convertWorkflow');
        const result = await runLocalWordToPdf(fs, selectedFile, {
          signal: controller.signal,
          onProgress,
        });
        if (!result.ok) {
          applyWorkflowFailure(result.error);
          return;
        }
        setResultMessage(result.value.message);
        setStatus('Conversion completed on this device. Nothing leaves your device for this operation.');
        return;
      }

      if (!selectedFile || !isPdfFile(selectedFile)) {
        setErrorMessage('Page operations require a selected PDF.');
        setRecovery('Select a PDF for split/extract/rotate, or use Merge / Convert for Word docs.');
        setErrorCategory('validation');
        return;
      }

      const { runSinglePdfOp } = await import('./lib/pdfOpsWorkflow');
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
      setStatus('Operation completed on this device. Nothing leaves your device for this operation.');
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
      setFileManageStatus(`Renamed ${result.value.renamedCount} file(s) in this session.`);
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
      setFileManageStatus(`Duplicated ${result.value.copiedCount} file(s) in this session.`);
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
        `Updated session paths for ${result.value.movedCount} file(s) → ${moveDestination}/ (not moved on disk).`,
      );
    });
  }

  async function runCreateFolder() {
    await runFileManage('createFolder', async () => {
      if (!directoryId) {
        setFileManageError('Select a folder first (Chrome/Edge), then create a subfolder.');
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
      setFileManageStatus(`Created folder “${result.value.directory.name}” locally.`);
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
        message: 'Reading files…',
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
          message: `Saving ${file.name}…`,
        });
        const written = await fs.writeBytes(file.bytes, { suggestedName: file.name });
        if (!written.ok) {
          setFileManageError(
            saved > 0
              ? `Exported ${saved} of ${read.value.length} file(s), then failed: ${formatAppErrorLine(written.error)}`
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
          message: `Saved ${file.name}`,
        });
      }
      setFileManageStatus(`Exported ${saved} file(s) locally (save/download).`);
    });
  }

  return (
    <div className="app-shell">
      <PublicJsonLd meta={homeMeta} />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {workspaceBusy
          ? picking
            ? 'Selecting documents.'
            : running
              ? progress?.message || 'Document operation in progress.'
              : fileManageBusy
                ? fileManageProgress?.message || 'File management in progress.'
                : 'Workspace busy.'
          : status || resultMessage || fileManageStatus || ''}
      </div>

      <header className="space-y-5">
        <SiteHeader preference={preference} onThemeChange={setPreference} workspace />

        <div className="max-w-3xl space-y-3">
          <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.75rem] sm:leading-[1.08]">
            Tell it what to do.
            <br className="hidden sm:block" /> Your files stay on your device.
          </h1>
          <p className="max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
            {SITE.supportingMessage}
          </p>
          <p className="max-w-2xl text-sm text-[var(--text-tertiary)] sm:text-base">
            {SITE.secondaryMessage}
          </p>
        </div>

        <TrustStatusStrip filesOnDevice={sessionFiles.length} />
      </header>

      <main id="main-content" className="flex flex-col gap-6 md:gap-8" tabIndex={-1}>
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
            Choose what you want to work with
          </h2>
          <p className="panel-desc">{capabilityCopy}</p>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Processed locally on your device.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              disabled={workspaceBusy}
              onClick={() => void pickFiles()}
              className="btn btn-primary"
              aria-busy={picking}
            >
              {picking ? 'Selecting…' : 'Select files'}
            </button>
            <button
              type="button"
              disabled={workspaceBusy}
              onClick={() => void pickFolder()}
              className="btn btn-secondary"
              aria-busy={picking}
            >
              {picking ? 'Selecting…' : 'Select folder'}
            </button>
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
              aria-label="Clear all documents from this session"
            >
              Clear
            </button>
          </div>

          <div
            className="dropzone"
            data-active={dropActive ? 'true' : 'false'}
            role="region"
            aria-label="Document drop zone. Drag and drop PDF, DOC, or DOCX files, or use Select files."
          >
            {picking ? (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]" role="status">
                  Selecting documents…
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Finish or cancel the system dialog to continue.
                </p>
              </>
            ) : files.length === 0 ? (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]">No documents yet</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Select files or a folder to get started.
                </p>
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  or drag and drop PDF, DOC, or DOCX here
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  or drag and drop files here
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">PDF, DOC, or DOCX</p>
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

        <FileManagePanel
          sortType={sortType}
          onSortTypeChange={setSortType}
          onSort={() => {
            if (workspaceBusy) return;
            applySort({ type: sortType } as SortingSpec);
            setFileManageStatus('Sorted files in this session.');
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
                ? `Showing matches for “${q}” (${useWorkspaceStore.getState().files.length} of ${useWorkspaceStore.getState().sessionFiles.length}). Clear the filter box and Apply to show all again.`
                : 'Filter cleared — full session list restored.',
            );
            setFileManageError(null);
          }}
          onClearFilter={() => {
            if (workspaceBusy) return;
            setFilterQuery('');
            clearFilter();
            setFileManageStatus('Filter cleared — full session list restored.');
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

        <PdfOpsPanel
          action={action}
          onActionChange={(next) => {
            if (workspaceBusy) return;
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
            Preview
          </h2>
          <p className="panel-desc mb-4">
            Local preview. Bytes stay on this device.
          </p>
          <Suspense
            fallback={
              <p className="text-sm text-[var(--text-secondary)]" role="status">
                Preparing preview…
              </p>
            }
          >
            <DocumentPreview file={deferredPreviewFile} fs={fs} />
          </Suspense>
        </section>

        <DiscoverabilitySections />
      </main>

      <SiteFooter />
    </div>
  );
}
