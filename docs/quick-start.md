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

For non-React projects, use `@devlens/core` directly:

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
- No data is sent anywhere — everything stays in your browser console
