# @devlens/ui

**A visual debug panel that shows every runtime issue in your app -- right in the browser.**

Console logs scroll away. You miss the warning that fired 30 seconds ago. You can't filter, you can't search, you can't export.

DevLens UI gives you a floating debug panel -- isolated in Shadow DOM, fully filterable, searchable, and exportable. One line of code.

## What You Get

- **Floating panel** -- toggle with `Ctrl+Shift+D`, never leaves your viewport; button shows a lens icon with the shortcut on hover
- **Two views** -- issue list and timeline (chronological)
- **Filter by severity** -- error, warn, info, or all
- **Filter by category** -- network, null-access, render-data, and more
- **Full-text search** -- type to filter issues by message, path, category, or source
- **Issue details** -- click any issue row to expand path, value, source, suggestion, and stack trace
- **Session persistence** -- issues survive page reloads via localStorage
- **Export** -- download all issues as JSON or CSV
- **Badge count** -- issue count with pulse animation on new issues
- **Dark and light themes** -- matches your preference
- **Shadow DOM isolation** -- panel styles never conflict with your app
- **Production-safe** -- auto-disabled in production, zero overhead
- **Dashboard opener** -- auto-open the hosted DevLens dashboard on first issue, or add a manual button to the panel

## Installation

```bash
npm install @devlens/core @devlens/ui
```

## Quick Start -- One Line

```ts
import { createDetectionEngine } from '@devlens/core';
import { createDevLensPanel, createPanelReporter } from '@devlens/ui';

const { panel, reporter, destroy } = createDevLensPanel({
  position: 'bottom-right',  // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme: 'dark',             // 'dark' | 'light'
  hotkey: 'ctrl+shift+d',   // customizable hotkey
});

const engine = createDetectionEngine({ reporter });

// That's it. Issues now appear in the panel.
```

## With React

```tsx
import { DevLensProvider } from '@devlens/react';
import { createDevLensPanel } from '@devlens/ui';

const { reporter } = createDevLensPanel({ theme: 'dark' });

function App() {
  return (
    <DevLensProvider config={{ reporter }}>
      <YourApp />
    </DevLensProvider>
  );
}
```

## With Vue

```ts
import { createDevLensPlugin } from '@devlens/vue';
import { createDevLensPanel } from '@devlens/ui';

const { reporter } = createDevLensPanel({ theme: 'dark' });

app.use(createDevLensPlugin({ reporter }));
```

## Panel Configuration

```ts
createDevLensPanel({
  position: 'bottom-right',   // toggle button position
  theme: 'dark',              // 'dark' | 'light'
  hotkey: 'ctrl+shift+d',    // keyboard shortcut to toggle
  panelWidth: 420,            // panel width in pixels
  panelHeight: 520,           // panel height in pixels
  defaultOpen: false,         // start with panel open?
  dashboardUrl: 'http://localhost:5173/__devlens__',  // optional: show dashboard button
});
```

## Panel Controls

| Action | How |
|--------|-----|
| Toggle panel | Click the floating lens button or press `Ctrl+Shift+D` |
| Filter by severity | Click Error / Warn / Info / All buttons |
| Search issues | Type in the search bar (filters by message, path, category, source) |
| View issue details | Click any issue row to expand |
| Switch views | Toggle between List and Timeline in the footer |
| Export JSON | Click the JSON button in the header |
| Export CSV | Click the CSV button in the header |
| Clear all issues | Click the CLR button in the header (turns red on hover) |
| Open dashboard | Click the monitor button above the toggle (when `dashboardUrl` is set) |

## Dashboard Opener

Open the hosted DevLens dashboard (served by `@devlens/vite`) automatically on the first detected issue, or let users open it manually.

### Auto-open on first issue

```ts
import { createDetectionEngine } from '@devlens/core';
import { createDashboardOpener, createDashboardReporter } from '@devlens/ui';

const opener = createDashboardOpener({
  dashboardUrl: 'http://localhost:5173/__devlens__',
  // sessionId?: string    -- auto-generated if omitted
  // windowName?: string   -- window.open target, default 'devlens-dashboard'
});

const engine = createDetectionEngine({
  reporter: createDashboardReporter(opener),
});

// Dashboard opens automatically in a new tab when the first issue is detected.
```

### Manual control

```ts
opener.open();           // open (or focus) the dashboard window
opener.close();          // close it
opener.isOpen            // true if window is currently open
opener.sessionId         // session ID used (append to dashboard URL)
opener.dashboardLink     // full URL: dashboardUrl + '?session=' + sessionId
```

### Panel button

Add a monitor-icon button above the main toggle that opens the dashboard on click:

```ts
createDevLensPanel({
  dashboardUrl: 'http://localhost:5173/__devlens__',
});
```

The button appears 50px above the main toggle, styled consistently with the panel. Hover turns it brand-purple.

### With Vite plugin

```ts
// vite.config.ts
import devlens from '@devlens/vite';

export default {
  plugins: [devlens()],
  // Dashboard available at http://localhost:5173/__devlens__
};

// main.ts
const opener = createDashboardOpener({
  dashboardUrl: `${location.origin}/__devlens__`,
});
const engine = createDetectionEngine({
  reporter: createDashboardReporter(opener),
});
```

## Inspector Window

The inspector opens a separate popup window (or navigates to a hosted dashboard URL) with full sidebar navigation, issue detail view, timeline, and AI Analysis.

```ts
import { createDevLensInspector, createInspectorReporter } from '@devlens/ui';

// Legacy popup mode
const inspector = createDevLensInspector();

// Or point at a hosted dashboard
const inspector = createDevLensInspector({
  dashboardUrl: 'http://localhost:5173/__devlens__',
});

const engine = createDetectionEngine({
  reporter: createInspectorReporter(inspector),
});
```

## License System

@devlens/ui includes a license key system for gating premium features:

```ts
import { createLicenseManager, createFeatureGate, generateLicenseKey } from '@devlens/ui';

const key = generateLicenseKey();
// => "DL-0AK3-M8X2-PQR5-TN7W"

const license = createLicenseManager();
license.activate(key);
console.log(license.isPro()); // true

const gate = createFeatureGate(license);
gate.isEnabled('timeline-view');  // true (Pro)
gate.isEnabled('search');         // true (Free)
```

**Free features:** issue-detail, search

**Pro features:** timeline-view, session-persistence, export-json, export-csv, category-filter

## API Reference

### Functions

| Export | Description |
|--------|-------------|
| `createDevLensPanel(config?)` | Creates the floating panel. Returns `{ panel, reporter, destroy }`. SSR-safe. |
| `createPanelReporter(panel)` | Reporter adapter that feeds issues to the panel. |
| `createDashboardOpener(config)` | Opens the hosted DevLens dashboard in a new window. Returns `{ open, close, destroy, isOpen, sessionId, dashboardLink }`. SSR-safe. |
| `createDashboardReporter(opener)` | Reporter adapter that auto-opens the dashboard on the first issue. |
| `createDevLensInspector(config?)` | Opens a dedicated inspector window. Returns `{ sendIssue, sendClear, open, close, destroy, connected, isOpen, sessionId, dashboardLink }`. SSR-safe. |
| `createInspectorReporter(inspector)` | Reporter adapter that auto-opens the inspector on first issue. |
| `createAdapter(sessionId)` | Low-level BroadcastChannel + postMessage adapter for inspector communication. |
| `createPanel(host, config?)` | Low-level panel constructor (attach to your own host element). |
| `createPersistenceManager()` | localStorage-backed issue persistence (max 200 issues). |
| `exportAsJSON(issues)` | Serialize issues array to formatted JSON string. |
| `exportAsCSV(issues)` | Serialize issues array to CSV string with headers. |
| `downloadFile(content, filename, mimeType)` | Trigger browser file download. |
| `createLicenseManager()` | License key management with localStorage persistence. |
| `createFeatureGate(license)` | Feature access control based on license status. |
| `generateLicenseKey()` | Generate a valid `DL-XXXX-XXXX-XXXX-XXXX` license key with checksum. |

### Types

| Export | Description |
|--------|-------------|
| `PanelConfig` | `{ position?, theme?, hotkey?, panelWidth?, panelHeight?, defaultOpen?, dashboardUrl? }` |
| `PanelInstance` | Panel with `open()`, `close()`, `toggle()`, `addIssue()`, `clear()`, `getIssues()`, `destroy()` |
| `DashboardOpenerConfig` | `{ dashboardUrl, sessionId?, windowName? }` |
| `DashboardOpenerInstance` | `{ open(), close(), destroy(), isOpen, sessionId, dashboardLink }` |
| `InspectorConfig` | `{ width?, height?, sessionId?, dashboardUrl? }` |
| `InspectorInstance` | Inspector with `sendIssue()`, `sendClear()`, `open()`, `close()`, `destroy()`, `connected`, `isOpen`, `sessionId`, `dashboardLink` |
| `LicenseManager` | `getStatus()`, `getInfo()`, `activate(key)`, `deactivate()`, `isPro()` |
| `LicenseInfo` | `{ status: LicenseStatus, key: string \| null, expiresAt: number \| null }` |
| `LicenseStatus` | `'free' \| 'pro' \| 'invalid'` |
| `FeatureGate` | `isEnabled(feature)`, `getFreeFeatures()`, `getProFeatures()`, `getAllFeatures()` |
| `Feature` | `'timeline-view' \| 'session-persistence' \| 'export-json' \| 'export-csv' \| 'issue-detail' \| 'search' \| 'category-filter'` |
| `PersistenceManager` | `save(issues)`, `load()`, `clear()` |
| `InspectorAdapter` | Low-level adapter with `send()`, `start()`, `stop()`, `sendIssue()`, `sendClear()`, `connected` |

## Technical Details

- **~84KB** ESM bundle (panel UI, inspector, dashboard opener, styles, license system)
- **Shadow DOM** -- panel styles are completely isolated, never leak into your app
- **Dual ESM + CJS** output with full TypeScript declarations
- **SSR-safe** -- returns noop instances when `document` is unavailable
- **Production-safe** -- auto-disabled when `NODE_ENV === 'production'`
- **z-index: 2147483647** -- panel always floats above your app
- **Version-stamped** -- footer shows the exact `@devlens/core` version injected at build time

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Debug panel with filtering, search, export, persistence, license gating | Done |
| v1.1 | Inspector window with AI-powered analysis (Gemini, Claude, GPT) | Done |
| v1.2 | Inspector `dashboardUrl` option -- navigate to hosted dashboard instead of Blob popup | Done |
| v1.3 | Dashboard opener, panel button, search fix, icon button, polished header actions | Done |
| v2.0 | Deep AI integration -- real-time pattern detection across issues, auto-fix generation, CI/CD integration | Planned |

## License

MIT -- [GitHub](https://github.com/crashsense/devlens) -- [Changelog](https://github.com/crashsense/devlens/blob/main/CHANGELOG.md)
