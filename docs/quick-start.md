# Quick Start

## Installation

::: code-group

```bash [npm]
npm install @devlens/core @devlens/react
```

```bash [yarn]
yarn add @devlens/core @devlens/react
```

```bash [pnpm]
pnpm add @devlens/core @devlens/react
```

:::

## React Setup

Wrap your app with `DevLensProvider` and `DevLensErrorBoundary`:

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

That's it. Open your browser console and DevLens will start logging detected issues.

## Vue Setup

```ts
import { createApp } from 'vue';
import { createDevLensPlugin } from '@devlens/vue';

const app = createApp(App);
app.use(createDevLensPlugin());
app.mount('#app');
```

The plugin automatically installs `app.config.errorHandler` and `app.config.warnHandler`.

::: code-group

```bash [npm]
npm install @devlens/core @devlens/vue
```

```bash [yarn]
yarn add @devlens/core @devlens/vue
```

```bash [pnpm]
pnpm add @devlens/core @devlens/vue
```

:::

## UI Panel

Add a visual debug overlay to any app:

```bash
npm install @devlens/ui
```

```ts
import { createDetectionEngine } from '@devlens/core';
import { createDevLensPanel, createPanelReporter } from '@devlens/ui';

const panel = createDevLensPanel({
  position: 'bottom-right',
  theme: 'dark',
  hotkey: 'ctrl+shift+d',
});

const engine = createDetectionEngine({
  reporter: createPanelReporter(panel),
});
```

Toggle with **Ctrl+Shift+D**. The panel provides:
- Issue list and timeline views
- Severity and category filtering
- Full-text search
- Session persistence (localStorage)
- Export as JSON or CSV


## Inspector Window

For a full DevTools-like experience, use the Inspector instead of the overlay panel. It opens a separate browser window:

```ts
import { createDetectionEngine } from '@devlens/core';
import { createDevLensInspector, createInspectorReporter } from '@devlens/ui';

const inspector = createDevLensInspector({
  width: 1200,
  height: 800,
});

const engine = createDetectionEngine({
  reporter: createInspectorReporter(inspector),
});
```

The inspector auto-opens on the first detected issue. It includes:
- Sidebar navigation: Issues, Timeline, AI Analysis, Settings
- AI Analysis tab with model selection (Gemini, Claude, GPT)
- BroadcastChannel communication (no same-origin restriction)
- Connection health monitoring with ping/pong

## Guard Your State

Use `useGuardedState` to automatically detect null/undefined access on your state objects:

```tsx
import { useGuardedState } from '@devlens/react';

function UserProfile() {
  const [user, setUser] = useGuardedState(initialUser, 'UserProfile');

  // If user.profile.avatar is null, DevLens auto-logs with full path
  return <img src={user.profile.avatar} />;
}
```

## Watch Render Data

Use `useGuardedEffect` to monitor multiple data values for null/undefined:

```tsx
import { useGuardedEffect } from '@devlens/react';

function Dashboard({ user, posts, settings }) {
  useGuardedEffect({ user, posts, settings }, 'Dashboard');

  // If any value is null/undefined, DevLens logs it
  return <div>...</div>;
}
```

## Vue Composables

### Guarded Ref

```ts
import { useGuardedRef } from '@devlens/vue';

const user = useGuardedRef(initialUser, 'UserProfile');
// Accessing null/undefined properties on user.value triggers detection
```

### Guarded Watch

```ts
import { useGuardedWatch } from '@devlens/vue';

useGuardedWatch({ user, posts, settings }, 'Dashboard');
// Null/undefined values are reported automatically
```

## Configuration

```tsx
<DevLensProvider
  config={{
    enabled: true,
    minSeverity: 'warn',
    throttleMs: 1000,
    maxIssues: 100,
    modules: {
      network: {
        fetch: true,
        xhr: true,
        ignoreUrls: ['/health', /\.hot-update\./],
      },
      guardian: {
        maxDepth: 5,
        ignorePaths: ['_internal'],
      },
      catcher: {
        windowErrors: true,
        unhandledRejections: true,
        consoleErrors: false,
      },
    },
  }}
>
  <App />
</DevLensProvider>
```

## Vanilla JS

For non-React/Vue projects, use `@devlens/core` directly:

```bash
npm install @devlens/core
```

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
```

## Production Safety

DevLens is designed for development only:

- Automatically disabled when `NODE_ENV === 'production'`
- `sideEffects: false` enables tree-shaking
- Provider renders children directly when disabled (zero overhead)
- No data is sent anywhere -- everything stays in your browser console
