# @devlens/react

DevLens React integration -- automatic runtime error detection for React applications.

## Installation

```bash
npm install @devlens/core @devlens/react
```

**Peer dependencies:** React >= 17.0.0

## Quick Start

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

## Guarded State

Automatically detect null/undefined access on state objects:

```tsx
import { useGuardedState } from '@devlens/react';

function UserProfile() {
  const [user, setUser] = useGuardedState(initialUser, 'UserProfile');

  // If user.profile.avatar is null, DevLens auto-logs:
  // [NULL] DevLens [WARN] null-access: Property "avatar" is null at path "user.profile.avatar"
  return <img src={user.profile.avatar} />;
}
```

## Watch Render Data

Monitor multiple values for null/undefined:

```tsx
import { useGuardedEffect } from '@devlens/react';

function Dashboard({ user, posts, settings }) {
  useGuardedEffect({ user, posts, settings }, 'Dashboard');

  // [RENDER] DevLens [WARN] render-data: "posts" is undefined in Dashboard
  return <div>...</div>;
}
```

## API Reference

| Export | Description |
|--------|-------------|
| `DevLensProvider` | Wrapper component, initializes DevLens |
| `DevLensErrorBoundary` | Error boundary with DevLens reporting |
| `useDevLens()` | Access the engine instance |
| `useGuardedState(initial, label?)` | useState with null/undefined detection |
| `useGuardedEffect(data, label?)` | Watch data for null/undefined |

## Details

- ~5KB ESM bundle
- Dual ESM + CJS output
- Full TypeScript declarations
- Production-safe -- auto-disabled in production

## License

MIT -- [github.com/crashsense/devlens](https://github.com/crashsense/devlens)
