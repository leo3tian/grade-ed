# Grade-Ed

A Chrome extension that streamlines grading on [EdStem](https://edstem.org).
Built for the UW CSE 12x (Intro to CS) staff.

## Features

- **Annotation menu** — searchable libraries of grading deductions, inserted into Ed's feedback editor with one click. Hover any deduction for an in-place markdown preview.
- **Linter** *(WIP)* — scans student code in the Feedback diff view and highlights flagged lines.

Stack: React, TypeScript, esbuild.

## Development

```bash
npm install
npm run dev
```

`npm run dev` watches `src/` and `public/` and rebuilds into `dist/` on every change. To load the extension in Chrome:

1. Open `chrome://extensions/`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked** and pick the `dist/` folder

Reload guide after edits:

| What changed | What to do |
| --- | --- |
| Popup files (`src/popup/`) | Close and reopen the popup |
| Content scripts (`src/content/`) | Click ↻ on the extension card, then reload the Ed tab |
| `manifest.json`, `background.ts` | Click ↻ on the extension card |

For a production-ready build:

```bash
npm run build       # minified bundle in dist/
npm run clean       # nuke dist/
```

## Layout

```
src/
  popup/            React popup UI (manage libraries of deductions)
    popup.html      Loaded by Chrome as the popup; refs popup.bundle.{js,css}
    popup.css       Bundled by esbuild via index.tsx
    index.tsx       Popup entry point
  content/          Scripts injected into edstem.org pages
    window.ts       Annotation menu + paste/preview
    linter.ts       Diff-view linter (WIP)
  background/       MV3 service worker (currently unused)
public/             Extension-level statics (manifest.json, icon.png)
scripts/build.mjs   The whole build pipeline
```

## Roadmap

- Fuzzy search across deductions (popup + in-Ed menu)
- User-defined linter rules — a rule is just `(line: string) => boolean`

## Feedback

Email `tleo@cs` for bugs, suggestions, or to contribute.
