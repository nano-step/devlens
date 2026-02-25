import type { DetectedIssue } from '@devlens/core';
import type { AIResult, AIModel, SingleIssueAIResult } from './types';

const SYSTEM_PROMPT = `You are DevLens AI - an expert JavaScript/TypeScript runtime error analyst. Analyze the following detected runtime issues from a web application and provide structured analysis.

RESPOND IN VALID JSON with this exact structure:
{
  "summary": "1-2 sentence overview of the application health based on detected issues",
  "criticalIssues": [{"title": "...", "severity": "critical|warning|info", "description": "...", "rootCause": "...", "fix": "...", "affectedPath": "..."}],
  "patterns": [{"title": "...", "description": "...", "relatedIssues": ["issue-id-1"]}],
  "suggestions": [{"title": "...", "priority": "high|medium|low", "description": "...", "codeExample": "..."}]
}

Rules:
- Focus on runtime issues: null access, undefined data, API failures, unhandled errors
- Identify patterns: are multiple issues related? Is there a common root cause?
- Provide specific, actionable fix suggestions with code examples when possible
- For network issues: suggest error handling, retry logic, fallback UI
- For null/undefined: suggest optional chaining, default values, loading states
- For unhandled errors: suggest error boundaries, try-catch, validation
- Be specific with property paths and component names from the issue data
- If no real issues found, acknowledge the app is healthy`;

function formatIssuesForAI(issues: DetectedIssue[]): string {
  return issues.map((issue, idx) => {
    const lines = [
      `Issue ${idx + 1}:`,
      `  ID: ${issue.id}`,
      `  Severity: ${issue.severity}`,
      `  Category: ${issue.category}`,
      `  Message: ${issue.message}`,
    ];
    if (issue.path) lines.push(`  Path: ${issue.path}`);
    if (issue.foundValue !== undefined) {
      lines.push(`  Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`);
    }
    if (issue.source) lines.push(`  Source: ${issue.source}`);
    if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
    if (issue.stack) {
      lines.push(`  Stack: ${issue.stack.split('\n').slice(0, 3).join(' | ')}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

export async function analyzeIssues(
  issues: DetectedIssue[],
  model: AIModel,
): Promise<AIResult> {
  const userPrompt = `Detected ${issues.length} runtime issues:\n\n${formatIssuesForAI(issues)}`;

  const response = await fetch('https://proxy.hoainho.info/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer hoainho',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }

  let text = content.trim();
  // Strip markdown code blocks
  if (text.startsWith('```')) {
    const nl = text.indexOf('\n');
    text = text.slice(nl + 1);
    const lf = text.lastIndexOf('```');
    if (lf > 0) text = text.slice(0, lf);
  }

  let result: AIResult;
  try {
    result = JSON.parse(text.trim()) as AIResult;
  } catch {
    result = {
      summary: text.slice(0, 500),
      criticalIssues: [],
      patterns: [],
      suggestions: [{
        title: 'Raw Analysis',
        priority: 'info',
        description: text.slice(0, 2000),
      }],
    };
  }

  result._model = model;
  result._tokens = data.usage?.total_tokens ?? 0;

  return result;
}

const SINGLE_ISSUE_PROMPT = `You are DevLens AI - an expert JavaScript/TypeScript runtime error analyst. Analyze the following single runtime issue from a web application.

RESPOND IN VALID JSON with this exact structure:
{
  "rootCause": "Clear explanation of why this error occurred",
  "fix": "Step-by-step fix with code example",
  "codeExample": "// Code snippet showing the fix",
  "impact": "What happens if this is not fixed",
  "prevention": "How to prevent this type of issue in the future"
}

Rules:
- Be specific and actionable - reference the exact property paths, component names, and values from the issue
- For network issues: suggest error handling, retry logic, fallback UI with code
- For null/undefined: suggest optional chaining, default values, loading states with code
- For unhandled errors: suggest error boundaries, try-catch, validation with code
- Keep the code example focused and minimal - just the fix, not the entire file
- If the issue has a suggestion field, build on it with more detail`;

function formatSingleIssueForAI(issue: DetectedIssue): string {
  const lines = [
    `Severity: ${issue.severity}`,
    `Category: ${issue.category}`,
    `Message: ${issue.message}`,
  ];
  if (issue.path) lines.push(`Path: ${issue.path}`);
  if (issue.foundValue !== undefined) {
    lines.push(`Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`);
  }
  if (issue.source) lines.push(`Source: ${issue.source}`);
  if (issue.suggestion) lines.push(`Existing suggestion: ${issue.suggestion}`);
  if (issue.details) {
    for (const [key, value] of Object.entries(issue.details)) {
      lines.push(`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
  }
  if (issue.stack) {
    lines.push(`Stack trace:\n${issue.stack.split('\n').slice(0, 5).join('\n')}`);
  }
  return lines.join('\n');
}

export async function analyzeSingleIssue(
  issue: DetectedIssue,
  model: AIModel,
): Promise<SingleIssueAIResult> {
  const userPrompt = `Analyze this runtime issue:\n\n${formatSingleIssueForAI(issue)}`;

  const response = await fetch('https://proxy.hoainho.info/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer hoainho',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SINGLE_ISSUE_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }

  let text = content.trim();
  if (text.startsWith('```')) {
    const nl = text.indexOf('\n');
    text = text.slice(nl + 1);
    const lf = text.lastIndexOf('```');
    if (lf > 0) text = text.slice(0, lf);
  }

  let result: SingleIssueAIResult;
  try {
    result = JSON.parse(text.trim()) as SingleIssueAIResult;
  } catch {
    result = {
      rootCause: text.slice(0, 500),
      fix: 'See raw analysis above.',
    };
  }

  result._model = model;
  result._tokens = data.usage?.total_tokens ?? 0;

  return result;
}
