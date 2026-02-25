import { useDashboardStore, useDashboardActions, sendClearToApp } from '../hooks/use-dashboard-store';
import { getCategoryCounts, exportAsJSON, exportAsCSV, downloadFile } from '../lib/utils';
import { CATEGORY_LABELS, CATEGORY_CSS } from '../lib/types';

export function Statusbar() {
  const { issues, categoryFilter } = useDashboardStore();
  const { setCategoryFilter } = useDashboardActions();
  const counts = getCategoryCounts(issues);

  return (
    <div className="statusbar">
      <div className="status-badges">
        {Object.entries(counts).map(([cat, count]) => {
          const cssClass = CATEGORY_CSS[cat] ?? '';
          const isActive = categoryFilter === cat;
          return (
            <span
              key={cat}
              className={`cat-badge ${cssClass}${isActive ? ' active' : ''}`}
              onClick={() => setCategoryFilter(isActive ? 'all' : cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat} {count}
            </span>
          );
        })}
      </div>
      <div className="status-actions">
        <button
          className="status-btn"
          onClick={() => {
            const json = exportAsJSON(issues);
            downloadFile(json, `devlens-issues-${Date.now()}.json`, 'application/json');
          }}
        >
          JSON
        </button>
        <button
          className="status-btn"
          onClick={() => {
            const csv = exportAsCSV(issues);
            downloadFile(csv, `devlens-issues-${Date.now()}.csv`, 'text/csv');
          }}
        >
          CSV
        </button>
        <button className="status-btn" onClick={sendClearToApp}>
          CLR
        </button>
      </div>
    </div>
  );
}
