import { useCallback, useState } from 'react';
import { useDashboardStore, useDashboardActions } from '../hooks/use-dashboard-store';
import { analyzeIssues } from '../lib/ai';
import { AI_MODELS } from '../lib/types';
import type { AIModel, AIResult } from '../lib/types';
import { Markdown } from '../lib/markdown';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none"><circle cx="14" cy="14" r="10" stroke="#6366f1" stroke-width="2.5"/><line x1="21.5" y1="21.5" x2="32" y2="32" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/><text x="9" y="18" font-family="monospace" font-size="10" font-weight="bold" fill="#6366f1">{}</text></svg>`;

function AIItemView({
  item,
}: {
  item: { title?: string; severity?: string; priority?: string; description?: string; rootCause?: string; fix?: string; codeExample?: string; affectedPath?: string; relatedIssues?: string[] };
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = item.severity ?? item.priority ?? 'info';

  return (
    <div
      className={`ai-item${expanded ? ' expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="ai-item-title">
        <span className={`ai-item-sev ${sev}`}>{sev}</span>
        {item.title ?? ''}
      </div>
      <div className="ai-item-body">
        {item.description && <Markdown content={item.description} />}
        {item.rootCause && (
          <div className="ai-item-field">
            <div className="ai-item-field-label">Root Cause</div>
            <Markdown content={item.rootCause} />
          </div>
        )}
        {item.fix && (
          <div className="ai-item-field">
            <div className="ai-item-field-label">Fix</div>
            <Markdown content={item.fix} />
          </div>
        )}
        {item.codeExample && (
          <Markdown content={'```\n' + item.codeExample + '\n```'} />
        )}
        {item.affectedPath && (
          <div className="ai-item-field">
            <div className="ai-item-field-label">Affected Path</div>
            <span className="mono">{item.affectedPath}</span>
          </div>
        )}
        {item.relatedIssues && item.relatedIssues.length > 0 && (
          <div className="ai-item-field">
            <div className="ai-item-field-label">Related Issues</div>
            {item.relatedIssues.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

function AIResults({ result }: { result: AIResult }) {
  return (
    <div className="ai-results">
      <div className="ai-summary">
        <div className="ai-summary-title">Summary</div>
        {result._model && (
          <div className="ai-summary-meta">
            <span>{result._model}</span>
            {result._tokens ? <span>{result._tokens} tokens</span> : null}
          </div>
        )}
        <Markdown content={result.summary ?? ''} />
      </div>

      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <div className="ai-section critical">
          <div className="ai-section-header">
            Critical Issues
            <span className="count">{result.criticalIssues.length}</span>
          </div>
          {result.criticalIssues.map((item, idx) => (
            <AIItemView key={`ci-${idx}`} item={item} />
          ))}
        </div>
      )}

      {result.patterns && result.patterns.length > 0 && (
        <div className="ai-section patterns">
          <div className="ai-section-header">
            Patterns Detected
            <span className="count">{result.patterns.length}</span>
          </div>
          {result.patterns.map((item, idx) => (
            <AIItemView key={`pa-${idx}`} item={item} />
          ))}
        </div>
      )}

      {result.suggestions && result.suggestions.length > 0 && (
        <div className="ai-section suggestions">
          <div className="ai-section-header">
            Suggestions
            <span className="count">{result.suggestions.length}</span>
          </div>
          {result.suggestions.map((item, idx) => (
            <AIItemView key={`su-${idx}`} item={item} />
          ))}
        </div>
      )}

      <div className="ai-disclaimer">
        AI analysis may contain inaccuracies. Always verify suggestions before implementing.
      </div>
    </div>
  );
}

export function AIPage() {
  const { issues, ai } = useDashboardStore();
  const { setAIState } = useDashboardActions();
  const [model, setModel] = useState<AIModel>('gemini-2.5-flash-lite');

  const handleAnalyze = useCallback(async () => {
    if (ai.loading || issues.length === 0) return;
    setAIState({ loading: true, error: null, result: null });
    try {
      const result = await analyzeIssues(issues, model);
      setAIState({ loading: false, result, error: null });
    } catch (err) {
      setAIState({
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [ai.loading, issues, model, setAIState]);

  return (
    <div className="content">
      <div className="ai-panel">
        <div className="ai-controls">
          <select
            className="ai-select"
            value={model}
            onChange={(e) => setModel(e.target.value as AIModel)}
          >
            {AI_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            className="ai-analyze-btn"
            disabled={ai.loading || issues.length === 0}
            onClick={handleAnalyze}
          >
            Analyze All Issues ({issues.length})
          </button>
        </div>

        {ai.loading && (
          <div className="ai-loading">
            <div className="ai-spinner" />
            <div className="ai-loading-text">Analyzing with {model}…</div>
          </div>
        )}

        {ai.error && (
          <div className="ai-error">
            <div className="ai-error-dot" />
            {ai.error}
            <button
              className="btn btn-ghost"
              style={{ marginLeft: 'auto' }}
              onClick={handleAnalyze}
            >
              Retry
            </button>
          </div>
        )}

        {ai.result && !ai.loading && <AIResults result={ai.result} />}

        {!ai.result && !ai.loading && !ai.error && (
          <div className="empty-state">
            <div className="empty-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <div className="empty-title">AI-Powered Analysis</div>
            <div className="empty-sub">
              Click &quot;Analyze All Issues&quot; to get AI-powered insights: root cause
              detection, pattern analysis, and actionable fix suggestions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
