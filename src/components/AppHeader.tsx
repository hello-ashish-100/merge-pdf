import { ThemeToggle } from "./ThemeToggle";

export const AppHeader = () => (
  <header className="mb-10 flex items-start justify-between gap-4">
    <div>
      <h1 className="text-4xl font-bold tracking-tight">PDF Merger</h1>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-500">
        Merge multiple PDF files directly in your browser.
      </p>
    </div>

    <ThemeToggle />
  </header>
);
