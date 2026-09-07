import { useMemo, useRef, useState, type DragEvent } from 'react';
import {
  SortingType,
  formatAppErrorLine,
  isDocxFile,
  isPdfFile,
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
import { appCommandRegistry, listAiSelectableCommands } from '@localdoc/orchestration';
import { DocumentPreview } from './components/DocumentPreview';
import { FileList } from './components/FileList';
import { FileManagePanel } from './components/FileManagePanel';
import { PdfOpsPanel, type PdfAction } from './components/PdfOpsPanel';
import { PrivacyStatus } from './components/PrivacyStatus';
import { runLocalDocumentMerge } from './lib/mergeWorkflow';
import { runSinglePdfOp } from './lib/pdfOpsWorkflow';
import { useWorkspaceStore } from './store';

export function App() {
  const fs = useMemo(() => createBrowserFilesystemAdapter(), []);
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
  } = useWorkspaceStore();

  const [status, setStatus] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const [action, setAction] = useState<PdfAction>('merge');
  const [pageSpec, setPageSpec] = useState('');
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [orderSpec, setOrderSpec] = useState('');

  const [sortType, setSortType] = useState<string>(SortingType.NATURAL_FILENAME);
  const [filterQuery, setFilterQuery] = useState('');
  const [renamePattern, setRenamePattern] = useState('{name}_{nn}');
  const [moveDestination, setMoveDestination] = useState('archive');
  const [folderName, setFolderName] = useState('exports');
  const [fileManageStatus, setFileManageStatus] = useState<string | null>(null);
  const [fileManageError, setFileManageError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<string | null>(null);
  const [affectedFiles, setAffectedFiles] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const capabilityCopy = useMemo(() => describeCapabilities(fs.capabilities), [fs]);
  const selectedFile = files.find((f) => f.id === selectedId) ?? null;
  const canCreateFolder = Boolean(directoryId) && fs.capabilities.supportsCreateFolder;

  const canRun =
    !running &&
    (action === 'merge'
      ? files.length >= 2
      : selectedFile !== null && isPdfFile(selectedFile));

  const disabledReason = !canRun
    ? action === 'merge'
      ? files.length < 2
        ? 'Add at least two PDF or DOCX files of the same type to merge.'
        : null
      : !selectedFile
        ? 'Select a PDF in the list first.'
        : !isPdfFile(selectedFile)
          ? 'Page operations work on PDFs only. Use Merge for DOCX.'
          : null
    : null;

  const hint =
    action === 'merge'
      ? `Merge same-type files (PDF or DOCX). ${appCommandRegistry.list().length} commands in the unified registry (${listAiSelectableCommands().length} AI-selectable).`
      : 'Page ops require a selected PDF. DOCX supports merge + text preview.';

  function patchSessionFromVisible(updatedVisible: LocalFileRef[]) {
    const byId = new Map(updatedVisible.map((f) => [f.id, f]));
    replaceFiles(sessionFiles.map((f) => byId.get(f.id) ?? f));
  }

  async function pickFiles() {
    setPickError(null);
    const result = await fs.pickFiles({ multiple: true, accept: DOCUMENT_ACCEPT });
    if (!result.ok) {
      // Cancel keeps the current workspace intact.
      if (result.error.category !== 'cancelled') {
        setPickError(formatAppErrorLine(result.error));
      } else {
        setStatus('File selection cancelled — your current list is unchanged.');
      }
      return;
    }
    setDirectory(null);
    const docs = result.value.filter((f) => isPdfFile(f) || isDocxFile(f));
    const ignored = result.value.length - docs.length;
    setFiles(docs);
    if (!docs.length) {
      setStatus(
        ignored > 0
          ? `No PDF/DOCX selected (${ignored} unsupported file(s) ignored).`
          : 'No documents selected.',
      );
      return;
    }
    setStatus(
      ignored > 0
        ? `${docs.length} document(s) selected locally (${ignored} unsupported ignored).`
        : `${docs.length} document(s) selected locally.`,
    );
  }

  async function pickFolder() {
    setPickError(null);
    const result = await fs.pickDirectory({ recursive: true, extensions: ['pdf', 'docx'] });
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
        ? `${result.value.files.length} document(s) discovered in “${result.value.directory.name}” (local only).`
        : `No PDF/DOCX found in “${result.value.directory.name}”.`,
    );
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setPickError(null);
    const allDropped = Array.from(event.dataTransfer.files);
    const dropped = allDropped.filter((f) => isPdfFile(f) || isDocxFile(f));
    if (!dropped.length) {
      setPickError('Drop PDF or DOCX files only.');
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
      ignored > 0 ? ` (${ignored} unsupported file(s) ignored)` : '';
    if (files.length > 0) {
      appendFiles(result.value, false);
      setStatus(`${result.value.length} document(s) appended from drop (local only)${note}.`);
    } else {
      setFiles(result.value);
      setStatus(`${result.value.length} document(s) loaded from drop (local only)${note}.`);
    }
  }

  function resetOpMessages() {
    setResultMessage(null);
    setErrorMessage(null);
    setRecovery(null);
    setErrorCategory(null);
    setAffectedFiles([]);
  }

  async function runOp() {
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

    if (action === 'merge') {
      const result = await runLocalDocumentMerge(fs, files, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      setRunning(false);
      setProgress(null);
      abortRef.current = null;
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setRecovery(result.error.recovery);
        setErrorCategory(result.error.category);
        setAffectedFiles(result.error.affectedFiles);
        return;
      }
      setResultMessage(result.value.message);
      setStatus('Merge completed on this device. No files were uploaded.');
      return;
    }

    if (!selectedFile || !isPdfFile(selectedFile)) {
      setRunning(false);
      setProgress(null);
      abortRef.current = null;
      setErrorMessage('Page operations require a selected PDF.');
      setRecovery('Select a PDF for split/extract/rotate, or use Merge for DOCX/PDF sets.');
      setErrorCategory('validation');
      return;
    }

    const result = await runSinglePdfOp(fs, selectedFile, action, {
      signal: controller.signal,
      onProgress: setProgress,
      pageSpec,
      rotation,
      orderSpec,
    });

    setRunning(false);
    setProgress(null);
    abortRef.current = null;

    if (!result.ok) {
      setErrorMessage(result.error.message);
      setRecovery(result.error.recovery);
      setErrorCategory(result.error.category);
      setAffectedFiles(result.error.affectedFiles);
      return;
    }

    setResultMessage(result.value.message);
    setStatus('Operation completed on this device. No files were uploaded.');
  }

  async function runRename() {
    setFileManageError(null);
    setFileManageStatus(null);
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
  }

  async function runCopy() {
    setFileManageError(null);
    setFileManageStatus(null);
    const result = await executeCopyFiles({ files }, undefined, fs);
    if (!result.ok) {
      setFileManageError(formatAppErrorLine(result.error));
      return;
    }
    appendFiles(result.value.files, false);
    setFileManageStatus(`Duplicated ${result.value.copiedCount} file(s) in this session.`);
  }

  async function runMove() {
    setFileManageError(null);
    setFileManageStatus(null);
    const result = await executeMoveFiles({ files, destination: moveDestination });
    if (!result.ok) {
      setFileManageError(formatAppErrorLine(result.error));
      return;
    }
    patchSessionFromVisible(result.value.files);
    setFileManageStatus(
      `Updated session paths for ${result.value.movedCount} file(s) → ${moveDestination}/ (not moved on disk).`,
    );
  }

  async function runCreateFolder() {
    setFileManageError(null);
    setFileManageStatus(null);
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
  }

  async function runExportAll() {
    setFileManageError(null);
    setFileManageStatus(null);
    const read = await readAllBytes(fs, files);
    if (!read.ok) {
      setFileManageError(formatAppErrorLine(read.error));
      return;
    }
    let saved = 0;
    for (const file of read.value) {
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
    }
    setFileManageStatus(`Exported ${saved} file(s) locally (save/download).`);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-sm tracking-wide text-[var(--ink-muted)] uppercase">LocalDoc AI</p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
          Tell it what to do. Your files stay on your device.
        </h1>
        <p className="max-w-2xl text-lg text-[var(--ink-muted)]">
          Select PDFs, organize them, then merge or edit pages — all locally in your browser.
        </p>
      </header>

      <PrivacyStatus
        filesOnDevice={files.length}
        processingLocation="This device (browser)"
        cloudDocumentProcessing="Off"
        aiProcessing="Off (not in Phase 1)"
      />

      <section
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <h2 className="text-xl font-medium">Choose what you want to work with</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{capabilityCopy}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={running}
            onClick={() => void pickFiles()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Select PDF / DOCX
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void pickFolder()}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Select folder
          </button>
          <button
            type="button"
            disabled={running}
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
            className="rounded-lg px-4 py-2 text-sm text-[var(--ink-muted)] disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        {status ? <p className="mt-4 text-sm text-[var(--accent)]">{status}</p> : null}
        {pickError ? <p className="mt-4 text-sm text-[var(--warn)]">{pickError}</p> : null}

        <FileList
          files={files}
          selectedId={selectedId}
          disabled={running}
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
          applySort({ type: sortType } as SortingSpec);
          setFileManageStatus('Sorted files in this session.');
          setFileManageError(null);
        }}
        filterQuery={filterQuery}
        onFilterQueryChange={setFilterQuery}
        onFilter={() => {
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
        disabled={running}
        hasFiles={sessionFiles.length > 0}
        status={fileManageStatus}
        error={fileManageError}
      />

      <PdfOpsPanel
        action={action}
        onActionChange={(next) => {
          setAction(next);
          if (next === 'extract' || next === 'delete') {
            if (!pageSpec.trim()) setPageSpec('1');
          }
          if (next === 'rotate') {
            // Blank = all pages (matches engine + label).
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
        canRun={canRun}
        running={running}
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

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-sm">
        <h2 className="text-xl font-medium">Preview</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--ink-muted)]">
          Uses your browser’s built-in PDF viewer. Bytes stay on this device.
        </p>
        <DocumentPreview file={selectedFile} fs={fs} />
      </section>

      <footer className="pb-8 text-xs text-[var(--ink-muted)]">
        Steps 1–10: unified command registry ready for AI. No authentication. No document upload.
      </footer>
    </div>
  );
}
