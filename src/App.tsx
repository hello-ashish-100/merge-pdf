import { AppHeader } from "./components/AppHeader";
import { ErrorMessage } from "./components/ErrorMessage";
import { MergeButton } from "./components/MergeButton";
import { PdfDropZone } from "./components/PdfDropZone";
import { PdfFileList } from "./components/PdfFileList";
import { usePdfMerger } from "./hooks/usePdfMerger";

const App = () => {
  const {
    files,
    error,
    isMerging,
    canMerge,
    addFiles,
    removeFile,
    moveFile,
    moveFileUp,
    moveFileDown,
    clearFiles,
    merge,
  } = usePdfMerger();

  return (
    <div className="min-h-screen bg-white text-zinc-900 transition-colors dark:bg-black dark:text-white">
      <main className="mx-auto w-full max-w-4xl px-6 sm:py-16 py-6">
        <AppHeader />

        <PdfDropZone onFilesSelected={addFiles} />

        <ErrorMessage message={error} />

        <div className="mt-6 flex justify-end">
          <MergeButton
            disabled={!canMerge}
            isMerging={isMerging}
            onClick={merge}
          />
        </div>

        <PdfFileList
          files={files}
          onReorder={moveFile}
          onMoveUp={moveFileUp}
          onMoveDown={moveFileDown}
          onRemove={removeFile}
          onClear={clearFiles}
        />
      </main>
    </div>
  );
};

export default App;
