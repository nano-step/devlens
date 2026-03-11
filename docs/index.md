---
layout: home

hero:
  name: DevLens
  text: See through your UI
  tagline: Zero-config runtime error detection for JS/TS. X-Ray Mode, API Contract Guardian, AI Auto-Fix, Session Recording — and more.
  image:
    src: /logo.svg
    alt: DevLens
  actions:
    - theme: brand
      text: Get Started
      link: /quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/nano-step/devlens
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/@devlens/core

features:
  - title: "\U0001F52C X-Ray Mode"
    details: "Hold Alt + hover over any element to see component name, props, state, classnames, and related DevLens issues. Works with React, Vue, and vanilla DOM. NEW in v3.0."
  - title: "\U0001F50C Plugin Ecosystem"
    details: "engine.registerPlugin() — first-class plugin API with lifecycle management. Build custom plugins or use built-in ones: API Contract Guardian, Async Tracker. NEW in v3.0."
  - title: "\U0001F4E1 API Contract Guardian"
    details: "Auto-learns your API response shapes and alerts when fields disappear or change type. Catches backend breaking changes before your UI breaks. NEW in v3.0."
  - title: "\U0001F9E0 AI Auto-Fix"
    details: "AI generates unified diff patches from source code context. Analyze issues and get copy-paste fixes directly in the dashboard. NEW in v3.0."
  - title: "\u23F1\uFE0F Session Recording"
    details: "QA exports a .devlens file with full session timeline. Dev imports it and sees exactly what QA saw. No more 'I can\u2019t reproduce it'. NEW in v3.0."
  - title: "\U0001F30A Async Flow Tracker"
    details: "Detect hung promises (pending > 30s) and duplicate concurrent fetch requests. NEW in v3.0."
  - title: Network Interceptor
    details: Auto-intercepts fetch and XHR. Logs 4xx/5xx errors with timing, URL, and fix suggestions. Zero config.
  - title: Data Guardian
    details: "ES6 Proxy wraps your objects to detect null/undefined access with full path tracking \u2014 e.g. \"user.profile.avatar is null\"."
  - title: UI Panel + Dashboard
    details: "Floating debug panel with Shadow DOM isolation. Full dashboard with AI analysis, timeline, filtering, export. Toggle with Ctrl+Shift+D."
  - title: Framework Support
    details: "React, Vue 3, and vanilla JS/Web Components. Zero-config adapters with guarded state hooks."
  - title: Tiny and Tree-shakeable
    details: "~22KB core + ~5KB framework adapters. Zero runtime deps. Dual ESM + CJS. Full TypeScript."
  - title: Production Safe
    details: "Auto-disabled when NODE_ENV=production. sideEffects: false. Zero overhead when inactive."
---

<div class="vp-doc" style="padding: 0 24px; max-width: 900px; margin: 0 auto;">

## Quick Start

### Install

```bash
# React
npm install @devlens/core @devlens/react

# Vue
npm install @devlens/core @devlens/vue

# Vanilla JS / Web Components
npm install @devlens/core @devlens/web
```

### React

```tsx
import { DevLensProvider, DevLensErrorBoundary } from '@devlens/react';

function App() {
  return (
    <DevLensProvider>
      <DevLensErrorBoundary>
        <YourApp />
      </DevLensErrorBoundary>
    </DevLensProvider>
  );
}
```

### Vue

```ts
import { createApp } from 'vue';
import { createDevLensPlugin } from '@devlens/vue';

const app = createApp(App);
app.use(createDevLensPlugin());
app.mount('#app');
```

### Vanilla JS

```ts
import { initDevLens } from '@devlens/web';

const { engine, destroy } = initDevLens();
```

## X-Ray Mode <span style="background:#6366f1;color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;vertical-align:middle">NEW v3.0</span>

Hold **Alt + hover** over any element. DevLens highlights it and shows component name, props, state, classnames, and related issues.

```ts
import { createDevLensPanel } from '@devlens/ui';

const { panel, reporter } = createDevLensPanel({
  xray: true, // enabled by default
});
```

No browser extension needed. No DevTools panel to open. Just hold Alt and look.

## Plugin System <span style="background:#6366f1;color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;vertical-align:middle">NEW v3.0</span>

```ts
import { createDetectionEngine, createApiContractPlugin, createAsyncTrackerPlugin } from '@devlens/core';

const engine = createDetectionEngine();
engine.registerPlugin(createApiContractPlugin({ endpoints: ['/api/*'] }));
engine.registerPlugin(createAsyncTrackerPlugin({ timeoutMs: 30000 }));
```

## Session Recording <span style="background:#6366f1;color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;vertical-align:middle">NEW v3.0</span>

QA finds a bug → exports `.devlens` file → Dev imports → sees exactly what QA saw.

```ts
import { createSessionRecorder, exportSession } from '@devlens/ui';

const recorder = createSessionRecorder('session-id', engine.subscribe);
recorder.start();
// ... later ...
exportSession(recorder.getSession());
```

## What You'll See in Console

<div class="console-preview">
<span class="warn">[NULL] DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"</span><br>
<span class="dim">&nbsp;&nbsp;|- Path: user.profile.avatar</span><br>
<span class="dim">&nbsp;&nbsp;|- Value: null</span><br>
<span class="dim">&nbsp;&nbsp;|- Source: UserProfile</span><br>
<span class="dim">&nbsp;&nbsp;\- Suggestion: Check if "avatar" is loaded/initialized before accessing</span><br>
<br>
<span class="error">[CONTRACT] DevLens [WARN] api-contract: Field "avatar" disappeared from GET /api/users response</span><br>
<span class="dim">&nbsp;&nbsp;|- Expected: string</span><br>
<span class="dim">&nbsp;&nbsp;|- Received: missing</span><br>
<span class="dim">&nbsp;&nbsp;\- Suggestion: Check if the API changed</span>
</div>

## Packages

| Package | Version | Size |
|---------|---------|------|
| @devlens/core | 3.0.0 | ~22KB |
| @devlens/react | 3.0.0 | ~5KB |
| @devlens/vue | 2.0.0 | ~5KB |
| @devlens/ui | 2.0.0 | ~102KB |
| @devlens/vite | 2.0.0 | ~1KB |
| @devlens/web | 0.1.0 | ~3KB |

## Roadmap

<div class="roadmap-timeline">
  <div class="roadmap-item done">
    <div class="roadmap-marker"></div>
    <div class="roadmap-content">
      <div class="roadmap-version">v1.0</div>
      <div class="roadmap-title">Console Logging</div>
      <div class="roadmap-desc">Network interception, null detection, error boundaries</div>
      <span class="roadmap-badge done">Released</span>
    </div>
  </div>
  <div class="roadmap-item done">
    <div class="roadmap-marker"></div>
    <div class="roadmap-content">
      <div class="roadmap-version">v2.0</div>
      <div class="roadmap-title">UI Panel + Vue + Dashboard</div>
      <div class="roadmap-desc">Floating debug panel, Vue 3 plugin, inspector window, embedded dashboard via Vite</div>
      <span class="roadmap-badge done">Released</span>
    </div>
  </div>
  <div class="roadmap-item current">
    <div class="roadmap-marker"></div>
    <div class="roadmap-content">
      <div class="roadmap-version">v3.0</div>
      <div class="roadmap-title">The Lens Update</div>
      <div class="roadmap-desc">X-Ray Mode, Plugin System, API Contract, AI Auto-Fix, Session Recording, Async Tracker, @devlens/web</div>
      <span class="roadmap-badge current">Current</span>
    </div>
  </div>
  <div class="roadmap-item planned">
    <div class="roadmap-marker"></div>
    <div class="roadmap-content">
      <div class="roadmap-version">v4.0</div>
      <div class="roadmap-title">Universal Coverage</div>
      <div class="roadmap-desc">Svelte, Solid, Angular adapters. Browser extension. Deeper AI integration.</div>
      <span class="roadmap-badge planned">Planned</span>
    </div>
  </div>
</div>

</div>
