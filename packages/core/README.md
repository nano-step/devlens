# @devlens/core

Automatic runtime error detection for JavaScript applications. Detects API failures, null/undefined access, missing render data, and unhandled errors -- with actionable context.

## Installation

```bash
npm install @devlens/core
```

## Quick Start

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

## Console Output

```
[NET] DevLens [ERROR] network: POST /api/users returned 500 Internal Server Error
  |- Status: 500
  |- Duration: 1234ms
  |- Suggestion: Server returned 500 -- check server logs
  \- Source: NetworkInterceptor
```

## API Reference

| Export | Description |
|--------|-------------|
| `createDetectionEngine(config?)` | Creates the core detection engine |
| `createNetworkInterceptor(engine, config?)` | Fetch/XHR interceptor |
| `createDataGuardian(engine, config?)` | Proxy-based null/undefined detection |
| `createGlobalCatcher(engine, config?)` | Global error + unhandled rejection handler |
| `createConsoleReporter()` | Formatted console output |

## Features

- Zero dependencies
- ~20KB ESM bundle
- Dual ESM + CJS output
- Full TypeScript declarations
- Production-safe -- auto-disabled when `NODE_ENV === 'production'`
- Tree-shakeable (`sideEffects: false`)

## License

MIT -- [github.com/crashsense/devlens](https://github.com/crashsense/devlens)
