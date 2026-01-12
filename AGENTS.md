# Repository Guidelines

## Project Structure & Module Organization
- `src/routes/+layout.svelte` and `src/routes/+page.svelte` define the app shell and landing page; `layout.css` holds global styles.
- `src/lib` contains reusable pieces: `components/` for UI, `hooks/` for app-specific helpers, `utils.ts` for shared helpers, `turbomesh.ts` for the wasm bindings, and `assets/` for local media.
- `static` serves public files; place the required `turbomesh.wasm` here so it is available at runtime.
- Configuration lives in `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, and `components.json` (UI generator metadata).

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server (use `-- --open` to launch a browser).
- `npm run build` — create a production bundle; ensure `static/turbomesh.wasm` exists first.
- `npm run preview` — serve the built bundle locally for smoke-testing.
- `npm run check` — run SvelteKit sync plus `svelte-check` for type and markup validation.
- `npm run lint` — `prettier --check` then `eslint .` for TS/Svelte linting.
- `npm run format` — format the repo with Prettier (Svelte and Tailwind plugins included).

## Coding Style & Naming Conventions
- Codebase is TypeScript + Svelte 5; default to 2-space indentation.
- Components use PascalCase file names (`Button.svelte`), hooks start with `use`, utilities use `camelCase` exports, and route files follow SvelteKit `+page`/`+layout` patterns.
- UI primitives follow shadcn-svelte conventions; prefer extending existing shadcn components before creating new ones to keep styling consistent.
- Keep styles colocated with components when possible; use `layout.css` for shared tokens.
- Run `npm run format` before commits; ESLint shares the same configuration as `prettier-config` to avoid conflicts.

## Testing Guidelines
- No dedicated test harness is present; rely on `npm run check` and `npm run lint` for regression detection.
- When adding features, prefer adding component-level tests (e.g., Playwright or Vitest) under `src/` following the route or component structure; name files `*.spec.ts` or `*.test.ts`.
- Include manual repro steps in PRs if automated tests are absent.

## Commit & Pull Request Guidelines
- Commit messages in this repo use short, imperative, lowercase phrases (e.g., `add header and remove test page`); keep scope-focused.
- PRs should include: a brief summary, linked issue (if any), before/after screenshots for UI changes, notes on wasm or asset updates, and steps to validate locally (`build`, `check`, `lint`, `preview` as appropriate).

## Assets & Configuration Tips
- Always bundle the matching `turbomesh.wasm` into `static/` and update `src/lib/turbomesh.ts` if the API surface changes.
- Avoid committing generated artifacts outside `static/`; keep secrets out of Vite/Svelte config and prefer `.env` entries loaded through Vite’s environment handling if needed.
