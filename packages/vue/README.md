# @devlens/vue

DevLens Vue 3 integration -- automatic runtime error detection for Vue applications.

## Installation

```bash
npm install @devlens/core @devlens/vue
```

**Peer dependencies:** Vue >= 3.3.0

## Quick Start

```ts
import { createApp } from 'vue';
import { createDevLensPlugin } from '@devlens/vue';

const app = createApp(App);

app.use(createDevLensPlugin({
  enabled: true,
  minSeverity: 'warn',
}));

app.mount('#app');
```

The plugin automatically installs `app.config.errorHandler` and `app.config.warnHandler` to capture Vue errors and warnings.

## Guarded Ref

Reactive ref with null/undefined detection:

```ts
import { useGuardedRef } from '@devlens/vue';

const user = useGuardedRef(initialUser, 'UserProfile');

// Accessing null/undefined properties on user.value triggers detection
```

## Watch Data

Monitor data for null/undefined values:

```ts
import { useGuardedWatch } from '@devlens/vue';

useGuardedWatch({ user, posts, settings }, 'Dashboard');

// [RENDER] DevLens [WARN] render-data: "posts" is undefined in Dashboard
```

## API Reference

| Export | Description |
|--------|-------------|
| `createDevLensPlugin(options?)` | Vue 3 plugin with auto error/warn handlers |
| `useDevLens()` | Inject the engine instance |
| `useGuardedRef(initialValue, label?)` | Reactive ref with null/undefined detection |
| `useGuardedWatch(data, label?)` | Watch data for null/undefined |

## Details

- ~5KB ESM bundle
- Auto error handler: `app.config.errorHandler`
- Auto warn handler: `app.config.warnHandler`
- Network interceptor and global catcher auto-installed
- Dual ESM + CJS output
- Full TypeScript declarations
- Production-safe -- auto-disabled in production

## License

MIT -- [github.com/crashsense/devlens](https://github.com/crashsense/devlens)
