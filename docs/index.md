---
layout: home

hero:
  name: DevLens
  text: Runtime Error Detection SDK
  tagline: Stop adding console.log everywhere. DevLens auto-detects API failures, null access, and missing render data — with actionable context.
  image:
    src: /logo.svg
    alt: DevLens
  actions:
    - theme: brand
      text: Get Started
      link: /quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/crashsense/devlens
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/@devlens/core

features:
  - icon: 🌐
    title: Network Interceptor
    details: Auto-intercepts fetch & XHR. Logs 4xx/5xx errors with timing, URL, and fix suggestions. Zero config — just wrap your app.
  - icon: 💀
    title: Data Guardian
    details: ES6 Proxy wraps your objects to detect null/undefined access with full path tracking — e.g. "user.profile.avatar is null".
  - icon: 🎨
    title: Render Data Watch
    details: Monitors state values your UI depends on. Alerts when critical props become null or undefined before rendering breaks.
  - icon: ⚡
    title: Zero Config
    details: Drop in DevLensProvider and see everything. No manual instrumentation needed. Dev-only — auto-disabled in production.
  - icon: 🔍
    title: Actionable Logs
    details: Not just "error occurred". DevLens shows the property path, expected type, found value, and suggests the fix.
  - icon: 🛡️
    title: Error Boundary
    details: Enhanced React ErrorBoundary that integrates with the DevLens engine. Supports render prop fallback with reset functionality.
  - icon: 📦
    title: Tiny & Tree-shakeable
    details: ~20KB core + ~5KB React adapter. Zero runtime dependencies. Dual ESM + CJS output with full TypeScript declarations.
  - icon: 🔒
    title: Production Safe
    details: Auto-disabled when NODE_ENV=production. sideEffects false enables tree-shaking. Zero overhead when inactive.
---

<div class="vp-doc" style="padding: 0 24px; max-width: 900px; margin: 0 auto;">

## Quick Start

### Install

```bash
npm install @devlens/core @devlens/react
```

### Wrap Your App

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

### Guard Your Data

```tsx
import { useGuardedState } from '@devlens/react';

function UserProfile() {
  const [user, setUser] = useGuardedState(initialUser, 'UserProfile');

  // If user.profile.avatar is null, DevLens auto-logs:
  return <img src={user.profile.avatar} />;
}
```

### What You'll See in Console

<div class="console-preview">
<span class="warn">💀 DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"</span><br>
<span class="dim">&nbsp;&nbsp;├─ Path: user.profile.avatar</span><br>
<span class="dim">&nbsp;&nbsp;├─ Value: null</span><br>
<span class="dim">&nbsp;&nbsp;├─ Source: UserProfile</span><br>
<span class="dim">&nbsp;&nbsp;├─ Suggestion: Check if "avatar" is loaded/initialized before accessing</span><br>
<span class="dim">&nbsp;&nbsp;└─ Timestamp: 2026-02-22T14:30:00.000Z</span><br>
<br>
<span class="error">🌐 DevLens [ERROR] network: POST /api/users returned 500 Internal Server Error</span><br>
<span class="dim">&nbsp;&nbsp;├─ Status: 500</span><br>
<span class="dim">&nbsp;&nbsp;├─ Duration: 1234ms</span><br>
<span class="dim">&nbsp;&nbsp;├─ Suggestion: Server returned 500 — check server logs</span><br>
<span class="dim">&nbsp;&nbsp;└─ Source: NetworkInterceptor</span>
</div>

## Vanilla JS

```ts
import {
  createDetectionEngine,
  createNetworkInterceptor,
  createGlobalCatcher,
  createDataGuardian,
} from '@devlens/core';

const engine = createDetectionEngine();

const network = createNetworkInterceptor(engine);
network.install();

const catcher = createGlobalCatcher(engine);
catcher.install();

const guardian = createDataGuardian(engine);
const data = guardian.guard(apiResponse, 'apiResponse');

// Accessing null/undefined properties now auto-logs
console.log(data.user.profile.avatar);
```

## Roadmap

| Version | Feature |
|---------|---------|
| **v1.0** ✅ | Console logging — network, null detection, error boundaries |
| **v2.0** | UI overlay with visual issue indicators |
| **v3.0** | Vue.js support |

</div>
