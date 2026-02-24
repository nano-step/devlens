import type { DetectedIssue, IssueCategory, Severity } from '@devlens/core';
import type { PanelConfig, PanelInstance, PanelState } from './types';
import { getPanelStyles } from './styles';
import { createPersistenceManager } from './persistence';
import { exportAsJSON, exportAsCSV, downloadFile } from './export';

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  'network': '[NET]',
  'null-access': '[NULL]',
  'undefined-data': '[UNDEF]',
  'render-data': '[RENDER]',
  'unhandled-error': '[ERR]',
  'unhandled-rejection': '[REJ]',
  'type-mismatch': '[TYPE]',
};

const MAX_DISPLAYED_ISSUES = 200;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function matchesSearch(issue: DetectedIssue, search: string): boolean {
  if (!search) return true;
  const lower = search.toLowerCase();
  return (
    issue.message.toLowerCase().includes(lower) ||
    (issue.path?.toLowerCase().includes(lower) ?? false) ||
    issue.category.toLowerCase().includes(lower) ||
    (issue.source?.toLowerCase().includes(lower) ?? false)
  );
}

function filterIssues(issues: DetectedIssue[], filter: PanelState['filter']): DetectedIssue[] {
  return issues.filter((issue) => {
    if (filter.severity !== 'all' && issue.severity !== filter.severity) return false;
    if (filter.category !== 'all' && issue.category !== filter.category) return false;
    if (!matchesSearch(issue, filter.search)) return false;
    return true;
  });
}

export function createPanel(
  container: HTMLElement,
  config: PanelConfig = {},
): PanelInstance {
  const position = config.position ?? 'bottom-right';
  const panelWidth = config.panelWidth ?? 420;
  const panelHeight = config.panelHeight ?? 520;
  const theme = config.theme ?? 'dark';
  const hotkey = config.hotkey ?? 'ctrl+shift+d';

  const state: PanelState = {
    isOpen: config.defaultOpen ?? false,
    issues: [],
    filter: { severity: 'all', category: 'all', search: '' },
    activeView: 'list',
    selectedIssueId: null,
  };

  const shadow = container.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = getPanelStyles(theme);
  shadow.appendChild(styleEl);

  const toggleBtn = el('button', `dl-toggle ${position}`);
  toggleBtn.textContent = 'DL';
  toggleBtn.setAttribute('aria-label', 'Toggle DevLens panel');

  const badge = el('span', 'dl-toggle-badge hidden');
  badge.textContent = '0';
  toggleBtn.appendChild(badge);
  shadow.appendChild(toggleBtn);

  let issueCountEl: HTMLElement;
  let searchInput: HTMLInputElement;
  let timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  const panel = el('div', `dl-panel ${position}`);
  panel.style.width = `${panelWidth}px`;
  panel.style.height = `${panelHeight}px`;
  if (state.isOpen) panel.classList.add('open');

  const header = buildHeader();
  panel.appendChild(header);

  const filters = buildFilters();
  panel.appendChild(filters);

  const issueList = el('div', 'dl-issue-list');
  panel.appendChild(issueList);

  const timeline = el('div', 'dl-timeline');
  timeline.style.display = 'none';
  panel.appendChild(timeline);

  const footer = buildFooter();
  panel.appendChild(footer);

  shadow.appendChild(panel);


  function buildHeader(): HTMLElement {
    const h = el('div', 'dl-header');

    const left = el('div', 'dl-header-left');
    const title = el('span', 'dl-title');
    title.textContent = 'DevLens';
    left.appendChild(title);

    issueCountEl = el('span', 'dl-issue-count');
    issueCountEl.textContent = '0 issues';
    left.appendChild(issueCountEl);

    h.appendChild(left);

    const actions = el('div', 'dl-header-actions');
    const exportJsonBtn = el('button', 'dl-header-btn');
    exportJsonBtn.textContent = 'JSON';
    exportJsonBtn.title = 'Export as JSON';
    exportJsonBtn.addEventListener('click', () => {
      const json = exportAsJSON(state.issues);
      downloadFile(json, `devlens-issues-${Date.now()}.json`, 'application/json');
    });
    actions.appendChild(exportJsonBtn);

    const exportCsvBtn = el('button', 'dl-header-btn');
    exportCsvBtn.textContent = 'CSV';
    exportCsvBtn.title = 'Export as CSV';
    exportCsvBtn.addEventListener('click', () => {
      const csv = exportAsCSV(state.issues);
      downloadFile(csv, `devlens-issues-${Date.now()}.csv`, 'text/csv');
    });
    actions.appendChild(exportCsvBtn);
    const clearBtn = el('button', 'dl-header-btn');
    clearBtn.textContent = 'CLR';
    clearBtn.title = 'Clear all issues';
    clearBtn.addEventListener('click', () => clearIssues());
    actions.appendChild(clearBtn);

    const closeBtn = el('button', 'dl-header-btn');
    closeBtn.textContent = 'X';
    closeBtn.title = 'Close panel';
    closeBtn.addEventListener('click', () => closePanel());
    actions.appendChild(closeBtn);

    h.appendChild(actions);
    return h;
  }

  function buildFilters(): HTMLElement {
    const f = el('div', 'dl-filters');

    const severities: Array<{ label: string; value: Severity | 'all'; activeClass: string }> = [
      { label: 'All', value: 'all', activeClass: 'active' },
      { label: 'Error', value: 'error', activeClass: 'active-error' },
      { label: 'Warn', value: 'warn', activeClass: 'active-warn' },
      { label: 'Info', value: 'info', activeClass: 'active-info' },
    ];

    for (const sev of severities) {
      const btn = el('button', 'dl-severity-btn');
      btn.textContent = sev.label;
      btn.dataset.severity = sev.value;
      if (sev.value === state.filter.severity) {
        btn.classList.add(sev.activeClass);
      }
      btn.addEventListener('click', () => {
        state.filter.severity = sev.value;
        updateFilterButtons();
        renderIssues();
      });
      f.appendChild(btn);
    }

    searchInput = el('input', 'dl-search') as HTMLInputElement;
    searchInput.type = 'text';
    searchInput.placeholder = 'Search issues...';
    searchInput.addEventListener('input', () => {
      state.filter.search = searchInput.value;
      renderIssues();
    });
    f.appendChild(searchInput);

    return f;
  }

  function buildFooter(): HTMLElement {
    const f = el('div', 'dl-footer');

    const label = el('span', 'dl-footer-label');
    label.textContent = 'DevLens v1.0.0';
    f.appendChild(label);

    const viewToggle = el('div', 'dl-view-toggle');

    const listBtn = el('button', 'dl-view-btn active');
    listBtn.textContent = 'List';
    listBtn.addEventListener('click', () => switchView('list'));
    viewToggle.appendChild(listBtn);

    const timelineBtn = el('button', 'dl-view-btn');
    timelineBtn.textContent = 'Timeline';
    timelineBtn.addEventListener('click', () => switchView('timeline'));
    viewToggle.appendChild(timelineBtn);

    f.appendChild(viewToggle);
    return f;
  }

  function updateFilterButtons(): void {
    const buttons = shadow.querySelectorAll('.dl-severity-btn');
    buttons.forEach((btn) => {
      const htmlBtn = btn as HTMLElement;
      htmlBtn.classList.remove('active', 'active-error', 'active-warn', 'active-info');
      const val = htmlBtn.dataset.severity;
      if (val === state.filter.severity) {
        if (val === 'all') htmlBtn.classList.add('active');
        else htmlBtn.classList.add(`active-${val}`);
      }
    });
  }

  function updateBadge(): void {
    const count = state.issues.length;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('hidden', count === 0);
    issueCountEl.textContent = `${count} issue${count !== 1 ? 's' : ''}`;
  }

  function pulseToggle(): void {
    toggleBtn.classList.remove('pulse');
    void toggleBtn.offsetWidth;
    toggleBtn.classList.add('pulse');
  }

  function renderIssues(): void {
    const filtered = filterIssues(state.issues, state.filter);

    if (state.activeView === 'list') {
      renderListView(filtered);
    } else {
      renderTimelineView(filtered);
    }
  }

  function renderListView(filtered: DetectedIssue[]): void {
    issueList.innerHTML = '';

    if (filtered.length === 0) {
      const empty = el('div', 'dl-empty');
      const icon = el('div', 'dl-empty-icon');
      icon.textContent = '--';
      empty.appendChild(icon);
      const text = el('div', 'dl-empty-text');
      text.textContent = 'No issues detected';
      empty.appendChild(text);
      const sub = el('div', 'dl-empty-sub');
      sub.textContent = state.issues.length > 0 ? 'Try adjusting your filters' : 'DevLens is watching...';
      empty.appendChild(sub);
      issueList.appendChild(empty);
      return;
    }

    const displayed = filtered.slice(-MAX_DISPLAYED_ISSUES);
    for (const issue of displayed) {
      issueList.appendChild(createIssueRow(issue));
    }

    issueList.scrollTop = issueList.scrollHeight;
  }

  function createIssueRow(issue: DetectedIssue): HTMLElement {
    const row = el('div', 'dl-issue');

    const iconWrap = el('div', `dl-issue-icon ${issue.severity}`);
    iconWrap.textContent = CATEGORY_LABELS[issue.category] ?? '[DL]';
    row.appendChild(iconWrap);

    const body = el('div', 'dl-issue-body');

    const message = el('div', 'dl-issue-message');
    message.textContent = issue.message;
    message.title = issue.message;
    body.appendChild(message);

    const meta = el('div', 'dl-issue-meta');

    const category = el('span', 'dl-issue-category');
    category.textContent = issue.category;
    meta.appendChild(category);

    const time = el('span', 'dl-issue-time');
    time.textContent = relativeTime(issue.timestamp);
    time.dataset.timestamp = String(issue.timestamp);
    meta.appendChild(time);

    const sevBadge = el('span', `dl-issue-severity ${issue.severity}`);
    sevBadge.textContent = issue.severity;
    meta.appendChild(sevBadge);

    body.appendChild(meta);
    row.appendChild(body);

    const detail = buildDetailView(issue);
    row.appendChild(detail);

    row.addEventListener('click', () => {
      const isExpanded = row.classList.contains('expanded');
      const allExpanded = shadow.querySelectorAll('.dl-issue.expanded');
      allExpanded.forEach((r) => r.classList.remove('expanded'));
      if (!isExpanded) {
        row.classList.add('expanded');
        state.selectedIssueId = issue.id;
      } else {
        state.selectedIssueId = null;
      }
    });

    return row;
  }

  function buildDetailView(issue: DetectedIssue): HTMLElement {
    const detail = el('div', 'dl-issue-detail');

    if (issue.path) {
      detail.appendChild(createDetailRow('Path', issue.path));
    }

    if (issue.foundValue !== undefined) {
      const val = issue.foundValue === null ? 'null' : String(issue.foundValue);
      detail.appendChild(createDetailRow('Value', val));
    }

    if (issue.source) {
      detail.appendChild(createDetailRow('Source', issue.source));
    }

    if (issue.details) {
      for (const [key, value] of Object.entries(issue.details)) {
        const displayVal = typeof value === 'string' ? value : JSON.stringify(value);
        detail.appendChild(createDetailRow(key, displayVal));
      }
    }

    if (issue.suggestion) {
      const suggestion = el('div', 'dl-detail-suggestion');
      suggestion.textContent = issue.suggestion;
      detail.appendChild(suggestion);
    }

    if (issue.stack) {
      const stack = el('div', 'dl-detail-stack');
      stack.textContent = issue.stack.split('\n').slice(0, 5).join('\n');
      detail.appendChild(stack);
    }

    return detail;
  }

  function createDetailRow(label: string, value: string): HTMLElement {
    const row = el('div', 'dl-detail-row');
    const labelEl = el('span', 'dl-detail-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    const valueEl = el('span', 'dl-detail-value');
    valueEl.textContent = value;
    row.appendChild(valueEl);
    return row;
  }

  function renderTimelineView(filtered: DetectedIssue[]): void {
    timeline.innerHTML = '';

    if (filtered.length === 0) {
      const empty = el('div', 'dl-empty');
      const icon = el('div', 'dl-empty-icon');
      icon.textContent = '--';
      empty.appendChild(icon);
      const text = el('div', 'dl-empty-text');
      text.textContent = 'No issues to display';
      empty.appendChild(text);
      timeline.appendChild(empty);
      return;
    }

    const displayed = filtered.slice(-MAX_DISPLAYED_ISSUES);
    for (const issue of displayed) {
      timeline.appendChild(createTimelineItem(issue));
    }

    timeline.scrollTop = timeline.scrollHeight;
  }

  function createTimelineItem(issue: DetectedIssue): HTMLElement {
    const item = el('div', 'dl-timeline-item');

    const line = el('div', 'dl-timeline-line');
    item.appendChild(line);

    const dot = el('div', `dl-timeline-dot ${issue.severity}`);
    item.appendChild(dot);

    const content = el('div', 'dl-timeline-content');

    const time = el('div', 'dl-timeline-time');
    time.textContent = relativeTime(issue.timestamp);
    time.dataset.timestamp = String(issue.timestamp);
    content.appendChild(time);

    const message = el('div', 'dl-timeline-message');
    message.textContent = issue.message;
    content.appendChild(message);

    const cat = el('div', 'dl-timeline-category');
    cat.textContent = `${CATEGORY_LABELS[issue.category] ?? ''} ${issue.category}`;
    content.appendChild(cat);

    item.appendChild(content);
    return item;
  }

  function switchView(view: 'list' | 'timeline'): void {
    state.activeView = view;
    issueList.style.display = view === 'list' ? '' : 'none';
    timeline.style.display = view === 'timeline' ? '' : 'none';

    const viewBtns = shadow.querySelectorAll('.dl-view-btn');
    viewBtns.forEach((btn, i) => {
      btn.classList.toggle('active', (i === 0 && view === 'list') || (i === 1 && view === 'timeline'));
    });

    renderIssues();
  }

  function openPanel(): void {
    state.isOpen = true;
    panel.classList.add('open');
  }

  function closePanel(): void {
    state.isOpen = false;
    panel.classList.remove('open');
  }

  function togglePanel(): void {
    if (state.isOpen) closePanel();
    else openPanel();
  }

  function handleHotkey(e: KeyboardEvent): void {
    const parts = hotkey.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needsCtrl = parts.includes('ctrl');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');
    const needsMeta = parts.includes('meta');

    if (
      e.key.toLowerCase() === key &&
      e.ctrlKey === needsCtrl &&
      e.shiftKey === needsShift &&
      e.altKey === needsAlt &&
      e.metaKey === needsMeta
    ) {
      e.preventDefault();
      togglePanel();
    }
  }

  function updateRelativeTimes(): void {
    const timeEls = shadow.querySelectorAll('[data-timestamp]');
    timeEls.forEach((timeEl) => {
      const ts = Number((timeEl as HTMLElement).dataset.timestamp);
      if (ts) (timeEl as HTMLElement).textContent = relativeTime(ts);
    });
  }

  toggleBtn.addEventListener('click', togglePanel);
  document.addEventListener('keydown', handleHotkey);
  timeUpdateInterval = setInterval(updateRelativeTimes, 5000);

  renderIssues();

  const persistence = createPersistenceManager();
  const restoredIssues = persistence.load();
  if (restoredIssues.length > 0) {
    state.issues = restoredIssues;
    updateBadge();
    renderIssues();
  }
  function addIssue(issue: DetectedIssue): void {
    state.issues.push(issue);
    if (state.issues.length > 1000) {
      state.issues = state.issues.slice(-500);
    }
    updateBadge();
    pulseToggle();
    renderIssues();
    persistence.save(state.issues);
  }
  function clearIssues(): void {
    state.issues = [];
    state.selectedIssueId = null;
    updateBadge();
    renderIssues();
    persistence.clear();
  }

  function getIssues(): readonly DetectedIssue[] {
    return [...state.issues];
  }

  function destroy(): void {
    document.removeEventListener('keydown', handleHotkey);
    if (timeUpdateInterval !== null) {
      clearInterval(timeUpdateInterval);
      timeUpdateInterval = null;
    }
    shadow.innerHTML = '';
  }

  return {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    addIssue,
    clear: clearIssues,
    getIssues,
    destroy,
  };
}
