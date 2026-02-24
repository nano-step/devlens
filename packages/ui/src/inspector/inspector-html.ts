import { getInspectorStyles } from './inspector-styles';
import { getInspectorScript } from './inspector-script';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>`;

export function getInspectorHTML(sessionId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>DevLens Inspector</title>
<style>${getInspectorStyles()}</style>
</head>
<body>
<div class="app">
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">${LOGO_SVG}</div>
      <div>
        <div class="sidebar-title">DevLens</div>
        <div class="sidebar-subtitle">Inspector</div>
      </div>
    </div>
    <div class="sidebar-nav">
      <div class="nav-item active" data-tab="issues">
        <div class="nav-dot issues"></div>
        <span>Issues</span>
        <span class="nav-count" id="nav-issues-count"></span>
      </div>
      <div class="nav-item" data-tab="timeline">
        <div class="nav-dot timeline"></div>
        <span>Timeline</span>
      </div>
      <div class="nav-item" data-tab="ai">
        <div class="nav-dot ai"></div>
        <span>AI Analysis</span>
      </div>
      <div class="nav-item" data-tab="settings">
        <div class="nav-dot settings"></div>
        <span>Settings</span>
      </div>
    </div>
    <div class="sidebar-footer">
      <div class="conn-status">
        <div class="conn-dot wait" id="conn-dot"></div>
        <span id="conn-text">Connecting…</span>
      </div>
      <div class="session-id mono">${sessionId}</div>
    </div>
  </div>
  <div class="main">
    <div class="topbar">
      <div class="topbar-title" id="topbar-title">Issues</div>
      <div class="topbar-controls" id="topbar-controls">
        <button class="sev-btn active" data-sev="all">All</button>
        <button class="sev-btn" data-sev="error">Error</button>
        <button class="sev-btn" data-sev="warn">Warn</button>
        <button class="sev-btn" data-sev="info">Info</button>
        <input class="search-input" id="search-input" type="text" placeholder="Search issues…">
      </div>
    </div>
    <div class="content" id="content"></div>
    <div class="statusbar">
      <div class="status-badges" id="status-badges"></div>
      <div class="status-actions">
        <button class="status-btn" id="export-json">JSON</button>
        <button class="status-btn" id="export-csv">CSV</button>
        <button class="status-btn" id="clear-btn">CLR</button>
      </div>
    </div>
  </div>
</div>
<script>var LOGO_SVG='${LOGO_SVG.replace(/'/g, "\\'")}';
${getInspectorScript(sessionId)}</script>
</body>
</html>`;
}
