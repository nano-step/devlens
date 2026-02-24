# @devlens/ui

Visual debug panel overlay for browser-based JavaScript applications. Displays runtime issues detected by DevLens in a floating, Shadow DOM-isolated panel.

## Installation

```bash
npm install @devlens/core @devlens/ui
```

## Quick Start

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

## Features

- Floating panel with Shadow DOM isolation
- Issue list view and timeline view
- Severity filtering (error, warn, info)
- Category filtering and full-text search
- Session persistence via localStorage
- Export issues as JSON or CSV
- Hotkey toggle (default: Ctrl+Shift+D)
- Dark and light theme support
- Badge count with pulse animation
- License key system with feature gating (Free vs Pro)
- Production-safe -- auto-disabled when `NODE_ENV === 'production'`

## API Reference

| Export | Description |
|--------|-------------|
| `createDevLensPanel(config?)` | Creates the floating debug panel |
| `createPanelReporter(panel)` | Reporter adapter for the detection engine |
| `createLicenseManager()` | License key management (activate/deactivate/validate) |
| `createFeatureGate(license)` | Feature gating based on license status |
| `generateLicenseKey()` | Generate a valid license key |

### Types

| Type | Description |
|------|-------------|
| `PanelConfig` | Panel configuration options |
| `PanelInstance` | Panel instance with open/close/toggle/addIssue/clear/destroy |
| `LicenseManager` | License management interface |
| `LicenseInfo` | License status, key, expiry |
| `LicenseStatus` | `'free' \| 'pro' \| 'invalid'` |
| `FeatureGate` | Feature access control |
| `Feature` | Available feature identifiers |

## Details

- ~37KB ESM bundle
- Shadow DOM prevents style conflicts with host page
- Dual ESM + CJS output
- Full TypeScript declarations

## License

MIT -- [github.com/crashsense/devlens](https://github.com/crashsense/devlens)
