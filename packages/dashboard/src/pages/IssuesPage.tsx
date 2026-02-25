import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectedIssue } from '@devlens/core';
import { useDashboardStore, useDashboardActions } from '../hooks/use-dashboard-store';
import { filterIssues, relativeTime } from '../lib/utils';
import { CATEGORY_LABELS, AI_MODELS } from '../lib/types';
import type { AIModel, IssueAIState } from '../lib/types';
import { analyzeSingleIssue } from '../lib/ai';
import { Markdown } from '../lib/markdown';

function InlineAIResult({ aiState }: { aiState: IssueAIState }) {
  if (aiState.loading) {
    return (
      <div className="inline-ai">
        <div className="inline-ai-header">
          <div className="inline-ai-spinner" />
          <span>Analyzing...</span>
        </div>
      </div>
    );
  }

  if (aiState.error) {
    return (
      <div className="inline-ai">
        <div className="inline-ai-header error">
          <span className="inline-ai-dot error" />
          <span>{aiState.error}</span>
        </div>
      </div>
    );
  }

  if (!aiState.result) return null;

  const { result } = aiState;

  return (
    <div className="inline-ai">
      <div className="inline-ai-header">
        <span className="inline-ai-label">AI Analysis</span>
        {result._model && <span className="inline-ai-meta">{result._model}</span>}
        {result._tokens ? <span className="inline-ai-meta">{result._tokens} tokens</span> : null}
      </div>

      <div className="inline-ai-section">
        <div className="inline-ai-section-label">Root Cause</div>
        <Markdown content={result.rootCause} />
      </div>

      <div className="inline-ai-section">
        <div className="inline-ai-section-label">Fix</div>
        <Markdown content={result.fix} />
      </div>

      {result.codeExample && (
        <div className="inline-ai-section">
          <div className="inline-ai-section-label">Code</div>
          <Markdown content={'```\n' + result.codeExample + '\n```'} />
        </div>
      )}

      {result.impact && (
        <div className="inline-ai-section">
          <div className="inline-ai-section-label">Impact</div>
          <Markdown content={result.impact} />
        </div>
      )}

      {result.prevention && (
        <div className="inline-ai-section">
          <div className="inline-ai-section-label">Prevention</div>
          <Markdown content={result.prevention} />
        </div>
      )}
    </div>
  );
}

function IssueDetail({ issue }: { issue: DetectedIssue }) {
  const { issueAI } = useDashboardStore();
  const { setIssueAI } = useDashboardActions();
  const [model, setModel] = useState<AIModel>('gemini-2.5-flash-lite');
  const aiState = issueAI[issue.id];

  const handleAnalyze = useCallback(async () => {
    if (aiState?.loading) return;
    setIssueAI(issue.id, { loading: true, error: null, result: null });
    try {
      const result = await analyzeSingleIssue(issue, model);
      setIssueAI(issue.id, { loading: false, result, error: null });
    } catch (err) {
      setIssueAI(issue.id, {
        loading: false,
        error: err instanceof Error ? err.message : 'Analysis failed',
      });
    }
  }, [aiState?.loading, issue, model, setIssueAI]);

  return (
    <div className="issue-detail visible">
      {issue.path && (
        <div className="detail-row">
          <span className="detail-label">Path</span>
          <span className="detail-value mono">{issue.path}</span>
        </div>
      )}
      {issue.foundValue !== undefined && (
        <div className="detail-row">
          <span className="detail-label">Value</span>
          <span className="detail-value mono">
            {issue.foundValue === null ? 'null' : String(issue.foundValue)}
          </span>
        </div>
      )}
      {issue.source && (
        <div className="detail-row">
          <span className="detail-label">Source</span>
          <span className="detail-value">{issue.source}</span>
        </div>
      )}
      {issue.details &&
        Object.entries(issue.details).map(([key, value]) => (
          <div key={key} className="detail-row">
            <span className="detail-label">{key}</span>
            <span className="detail-value">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        ))}
      {issue.suggestion && (
        <div className="detail-suggestion">{issue.suggestion}</div>
      )}
      {issue.stack && (
        <div className="detail-stack">
          {issue.stack.split('\n').slice(0, 5).join('\n')}
        </div>
      )}
      <div className="detail-actions">
        <select
          className="inline-ai-select"
          value={model}
          onChange={(e) => {
            e.stopPropagation();
            setModel(e.target.value as AIModel);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {AI_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          className="btn btn-brand"
          disabled={aiState?.loading}
          onClick={(e) => {
            e.stopPropagation();
            handleAnalyze();
          }}
        >
          {aiState?.loading ? 'Analyzing...' : aiState?.result ? 'Re-analyze' : 'Analyze with AI'}
        </button>
      </div>

      {aiState && <InlineAIResult aiState={aiState} />}
    </div>
  );
}

function IssueRow({
  issue,
  isExpanded,
  onToggle,
}: {
  issue: DetectedIssue;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <div
        className={`issue-row${isExpanded ? ' expanded' : ''}`}
        onClick={onToggle}
      >
        <div className={`issue-sev-bar ${issue.severity}`} />
        <span className={`issue-badge ${issue.severity}`}>
          {CATEGORY_LABELS[issue.category] ?? 'DL'}
        </span>
        <div className="issue-body">
          <div className="issue-msg" title={issue.message}>
            {issue.message}
          </div>
          <div className="issue-meta">
            {issue.source && (
              <span className="issue-source">{issue.source}</span>
            )}
            <span>{issue.category}</span>
            <span className="issue-time">{relativeTime(issue.timestamp)}</span>
          </div>
        </div>
      </div>
      {isExpanded && <IssueDetail issue={issue} />}
    </>
  );
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>`;

export function IssuesPage() {
  const { issues, severityFilter, categoryFilter, searchQuery, expandedIssueId } =
    useDashboardStore();
  const { toggleExpandedIssue } = useDashboardActions();
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = filterIssues(issues, severityFilter, categoryFilter, searchQuery);

  // Auto-scroll to bottom when new issues arrive
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [issues.length]);

  if (filtered.length === 0) {
    return (
      <div className="content" ref={contentRef}>
        <div className="empty-state">
          <div className="empty-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="empty-title">No issues detected yet</div>
          <div className="empty-sub">
            {issues.length > 0
              ? 'Try adjusting your filters'
              : 'DevLens is watching your application for runtime errors, null access, API failures, and more.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content" ref={contentRef}>
      {filtered.map((issue) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          isExpanded={expandedIssueId === issue.id}
          onToggle={() => toggleExpandedIssue(issue.id)}
        />
      ))}
    </div>
  );
}
