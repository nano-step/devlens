# Changelog

## 2.0.3 / 1.0.4 / 1.0.3 (2026-02-24, 02:46 UTC)

### Bug Fixes

- **@devlens/core** v2.0.3, **@devlens/react** v2.0.3 -- Fixed CJS/ESM module resolution (critical)
  - `package.json` declared `main: ./dist/index.cjs` and `exports.require: ./dist/index.cjs`, but tsup outputs `index.js` for CJS
  - This caused `MODULE_NOT_FOUND` errors in Webpack and any CJS consumer
  - Fixed: `main` now points to `./dist/index.js`, `module` to `./dist/index.mjs`, matching the actual build output
  - Aligned with the correct pattern already used by @devlens/ui and @devlens/vue

### Changes

- **@devlens/ui** v1.0.4, **@devlens/vue** v1.0.3 -- Version bump to depend on @devlens/core 2.0.3
- Added `npm run validate` script to verify all declared dist files exist after build

### Verified

- TDZ bug (ui panel crash on `buildHeader()`) was already fixed in v1.0.3 source and published dist -- confirmed no regression

### Published

- `@devlens/core@2.0.3` -- 2026-02-24 02:45 UTC
- `@devlens/react@2.0.3` -- 2026-02-24 02:46 UTC
- `@devlens/ui@1.0.4` -- 2026-02-24 02:46 UTC
- `@devlens/vue@1.0.3` -- 2026-02-24 02:46 UTC

---

## 2.0.2 / 1.0.3 / 1.0.2 (2026-02-24)

### Bug Fixes

- **@devlens/core** v2.0.2 -- Fixed console reporter noise: consolidated all detail lines into a single `consoleFn()` call to prevent per-line stack traces in browsers
- **@devlens/core** v2.0.2 -- Fixed multi-reporter: engine now composes custom reporter with console reporter so both panel and console receive issues
- **@devlens/ui** v1.0.3 -- Fixed TDZ crash: moved `let` declarations before `buildHeader()` call

### Changes

- **@devlens/react** v2.0.2, **@devlens/vue** v1.0.2 -- Version bump to depend on @devlens/core 2.0.2

## 2.0.0 (2026-02-24)

### Breaking Changes

- **@devlens/core**: Console reporter output format changed -- emoji icons replaced with text labels ([NET], [NULL], [UNDEF], [RENDER], [ERR], [REJ], [TYPE])
- **@devlens/core**: Tree-drawing characters in console output replaced with ASCII (`|-` and `\-`)

### New Packages

- **@devlens/ui** v1.0.0 -- Visual debug panel overlay
  - Floating panel with Shadow DOM isolation
  - Issue list and timeline views
  - Severity filtering, category filtering, search
  - Session persistence (localStorage)
  - Export issues as JSON or CSV
  - Hotkey toggle (Ctrl+Shift+D)
  - Dark/light theme support
  - License key system with feature gating (Free vs Pro)
  - Production-safe (auto-disabled)

- **@devlens/vue** v1.0.0 -- Vue 3 integration
  - Vue plugin with auto error/warn handler integration
  - useGuardedRef() -- reactive ref with null/undefined detection
  - useGuardedWatch() -- watch data for null/undefined
  - useDevLens() -- inject engine instance

### Changes

- **@devlens/react** v2.0.0 -- Updated to use @devlens/core v2.0.0

## 1.0.0 (2026-02-22)

### Initial Release

- **@devlens/core** -- Detection engine, network interceptor, data guardian, global catcher, console reporter
- **@devlens/react** -- React provider, error boundary, guarded state/effect hooks
