# Changelog

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
