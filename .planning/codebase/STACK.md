# Stack

## Runtime

- Node.js project using TypeScript with strict compiler settings.
- `tsconfig.json` targets `ES2022`, emits CommonJS into `dist`, and includes `src/**/*.ts` plus `tests/**/*.ts`.
- The generator runs as compiled Node code through `node dist/src/index.js`.

## Package Scripts

- `npm run build` runs `tsc`.
- `npm run generate` builds and runs `dist/src/index.js`.
- `npm test` regenerates output and then runs Node's built-in test runner against `dist/tests/*.test.js`.
- `npm run dev` regenerates data and starts Vite on `127.0.0.1`.
- `npm run web:build` regenerates data and runs `vite build`.
- `npm run web:preview` serves the production build with Vite preview.

## Frontend

- Vite app with React 19.
- Entry point is `src/web/main.tsx`.
- Main app surface is `src/web/App.tsx`.
- Styling is plain CSS in `src/web/styles.css`.
- Data is copied into `public/data/*.json` by `src/generator.ts` when generating the default `output` directory.

## Core Dependencies

- `typescript` for compile-time checks.
- `vite` and `@vitejs/plugin-react` for the local web app.
- `react` and `react-dom` for the web interface.
- `lucide-react` is available for iconography.
- `node:test` and `node:assert/strict` are used for tests; no separate test framework is installed.

## Generated Artifacts

- Primary generated JSON lives in `output/`.
- Web-readable copies live in `public/data/`.
- Production web output lives in `web-dist/`.
- Compiled TypeScript output lives in `dist/` after build.

## Local Source Files

- Source-list inputs live under `source-lists/`.
- The HSK 3.0 list is file-backed through `source-lists/hsk30.csv`.
- TUBELEX, SUBTLEX-CH, and TOCFL source files are present under `source-lists/`.
- Authored CI sentence intake is file-backed at `source-lists/authored-ci-sentences.json`.
