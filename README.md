# PDF Merger

Merge multiple PDFs into one, entirely in the browser. Files are never uploaded — everything happens on your device.

- Drag & drop or click to add PDFs (non-PDFs are rejected, duplicates are ignored)
- Reorder before merging by dragging rows, or with the per-row ↑ / ↓ buttons
- Works with touch: press and hold a row, or drag it by the grip handle, with auto-scroll at the screen edges
- Light and dark themes, following your OS by default

## Requirements

Node `^20.19.0 || >=22.12.0` (required by Vite 8).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed URL. To try it on a phone on the same network:

```bash
npm run dev -- --host
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Project structure

```
src/
├── main.tsx                Entry point
├── index.css               Tailwind import and the dark-mode variant
├── App.tsx                 Screen layout; wires hook state into components
├── components/
│   ├── AppHeader.tsx       Title and theme toggle
│   ├── ErrorMessage.tsx    Single error line
│   ├── MergeButton.tsx     Merge action
│   ├── PdfDropZone.tsx     File input and drop target
│   ├── PdfFileList.tsx     Sortable list of queued PDFs
│   ├── PdfFileItem.tsx     One row: drag handle, name, size, actions
│   ├── ThemeToggle.tsx     Light/dark switch
│   └── ui/IconButton.tsx   Shared small icon button
├── hooks/
│   ├── usePdfMerger.ts     Feature hook: queue + merge + error state
│   ├── usePdfFiles.ts      Ordered file queue (add, remove, move, clear)
│   ├── useFileDrop.ts      Drop-target wiring and hover state
│   ├── useDragReorder.ts   Pointer-based list reordering
│   └── useTheme.ts         Theme preference and resolved theme
├── lib/
│   ├── mergePdfs.ts        pdf-lib merge, framework-free
│   ├── download.ts         Bytes to a browser download
│   ├── files.ts            PDF check, dedupe key, size formatting
│   ├── theme.ts            Storage, OS preference, applying to <html>
│   └── themeStore.ts       Shared theme state
├── constants/              MIME type, limits, messages, theme keys
└── types/                  Shared type definitions
```

## How it works

**Merging.** [`mergePdfs`](src/lib/mergePdfs.ts) loads each file with [pdf-lib](https://pdf-lib.js.org/), copies its pages into a new document in list order, and returns the bytes. The result is handed to the browser as an object URL download. No network requests are involved, so the app works offline and nothing leaves the device.

**State.** [`usePdfMerger`](src/hooks/usePdfMerger.ts) is the only hook `App` consumes. It composes the file queue, owns `isMerging` and the single error message, and exposes `canMerge`. Files are de-duplicated by name + size + last-modified, which also gives each row a React key that survives reordering.

**Reordering.** [`useDragReorder`](src/hooks/useDragReorder.ts) uses pointer events rather than the HTML5 drag API, which never fires on touch devices. It behaves like a kanban board: the pressed card lifts and follows the pointer, the other rows slide aside to open a dashed gap, and the card animates into that gap on release — the array is only spliced once, when the drop lands. Row geometry is snapshotted at drag start, so the transforms it applies can never feed back into hit-testing. A mouse can grab anywhere on a card and activates after 4px of travel, so a plain click stays a click; touch either presses and holds for 220ms or grabs the grip handle immediately, leaving the rest of the row scrollable until then. The ↑ / ↓ buttons remain the keyboard path.

**Theming.** The preference (`light`, `dark` or `system`) lives in `localStorage` and resolves to a `dark` class on `<html>`, which drives Tailwind's `dark:` variant via a custom variant in `index.css`. While set to `system`, a `matchMedia` listener tracks OS changes live. An inline script in `index.html` applies the stored theme before first paint to avoid a flash of the wrong colours.

## Tech stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · pdf-lib · Oxlint
