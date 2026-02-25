import { useDashboardStore } from '../hooks/use-dashboard-store';
import { filterIssues, relativeTime } from '../lib/utils';
import { CATEGORY_LABELS } from '../lib/types';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>`;

export function TimelinePage() {
  const { issues, severityFilter, categoryFilter, searchQuery } = useDashboardStore();
  const filtered = filterIssues(issues, severityFilter, categoryFilter, searchQuery);

  if (filtered.length === 0) {
    return (
      <div className="content">
        <div className="empty-state">
          <div className="empty-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="empty-title">No issues to display</div>
          <div className="empty-sub">Adjust your filters or wait for issues.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {filtered.map((issue) => (
        <div key={issue.id} className="tl-item">
          <div className="tl-line" />
          <div className={`tl-dot ${issue.severity}`} />
          <div className="tl-content">
            <div className="tl-time">{relativeTime(issue.timestamp)}</div>
            <div className="tl-msg">{issue.message}</div>
            <div className="tl-cat">
              <span className={`issue-badge ${issue.severity}`}>
                {CATEGORY_LABELS[issue.category] ?? 'DL'}
              </span>{' '}
              {issue.category}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
