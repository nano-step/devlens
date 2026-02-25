import type { DetectedIssue } from '@devlens/core';
import type { AIResult, AIModel, SingleIssueAIResult } from './types';
import { getSourceContextForIssue } from './source-fetcher';

const API_URL = 'https://proxy.hoainho.info/v1/chat/completions';
const API_KEY = 'Bearer hoainho';

// ── Bulk Analysis ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are DevLens AI - a JavaScript/TypeScript runtime error analyst.
Analyze the detected runtime issues and provide structured analysis.

RESPOND IN VALID JSON:
{
  "summary": "1-2 sentences. App health overview.",
  "criticalIssues": [{"title": "...", "severity": "critical|warning|info", "description": "...", "rootCause": "...", "fix": "...", "affectedPath": "..."}],
  "patterns": [{"title": "...", "description": "...", "relatedIssues": ["id"]}],
  "suggestions": [{"title": "...", "priority": "high|medium|low", "description": "...", "codeExample": "..."}]
}

RULES:
- Use markdown in text fields: **bold**, \`inline code\`, \`\`\`code blocks\`\`\`
- Each description/rootCause/fix: max 80 words
- Reference exact file paths, line numbers, variable names from source code when provided
- Group related issues into patterns instead of repeating
- No filler phrases ("It appears that", "This issue occurs because")
- Go straight to the analysis`;

function formatIssuesForAI(
  issues: DetectedIssue[],
  sourceContexts: string[],
): string {
  return issues
    .map((issue, idx) => {
      const lines = [
        `Issue ${idx + 1}:`,
        `  Severity: ${issue.severity}`,
        `  Category: ${issue.category}`,
        `  Message: ${issue.message}`,
      ];
      if (issue.path) lines.push(`  Path: ${issue.path}`);
      if (issue.foundValue !== undefined) {
        lines.push(
          `  Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`,
        );
      }
      if (issue.source) lines.push(`  Source: ${issue.source}`);
      if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
      if (issue.stack) {
        lines.push(
          `  Stack: ${issue.stack.split('\n').slice(0, 3).join(' | ')}`,
        );
      }
      if (sourceContexts[idx]) {
        lines.push(`  ${sourceContexts[idx]}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

async function callAI(
  model: AIModel,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<{ text: string; tokens: number }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }

  let text = content.trim();
  // Strip markdown code block wrapper
  if (text.startsWith('```')) {
    const nl = text.indexOf('\n');
    text = text.slice(nl + 1);
    const lf = text.lastIndexOf('```');
    if (lf > 0) text = text.slice(0, lf);
  }

  return { text: text.trim(), tokens: data.usage?.total_tokens ?? 0 };
}

export async function analyzeIssues(
  issues: DetectedIssue[],
  model: AIModel,
): Promise<AIResult> {
  // Fetch source context for first 3 issues only (save tokens)
  const sourceContexts: string[] = [];
  for (let i = 0; i < Math.min(issues.length, 3); i++) {
    try {
      sourceContexts[i] = await getSourceContextForIssue(issues[i]!);
    } catch {
      sourceContexts[i] = '';
    }
  }

  const userPrompt = `Detected ${issues.length} runtime issues:\n\n${formatIssuesForAI(issues, sourceContexts)}`;
  const { text, tokens } = await callAI(model, SYSTEM_PROMPT, userPrompt, 2048);

  let result: AIResult;
  try {
    result = JSON.parse(text) as AIResult;
  } catch {
    result = {
      summary: text.slice(0, 500),
      criticalIssues: [],
      patterns: [],
      suggestions: [
        {
          title: 'Raw Analysis',
          priority: 'info',
          description: text.slice(0, 2000),
        },
      ],
    };
  }

  result._model = model;
  result._tokens = tokens;
  return result;
}

// ── Single Issue Analysis ──────────────────────────────────────

const SINGLE_ISSUE_PROMPT = `You are DevLens AI - a JavaScript/TypeScript runtime error analyst.
Analyze the single runtime issue below. Source code from the user's application is provided when available.

RESPOND IN VALID JSON:
{
  "rootCause": "1-2 sentences. What exactly caused this error.",
  "fix": "Concise fix with code. Use markdown: **bold**, \`code\`, \`\`\`code blocks\`\`\`.",
  "codeExample": "// minimal fix code only",
  "impact": "1 sentence. What breaks if unfixed.",
  "prevention": "1 sentence. How to prevent this class of error."
}

RULES:
- Reference EXACT file paths, line numbers, and variable names from the source code
- Each field: max 100 words
- codeExample: only the fix, not the entire file
- Use markdown: **bold**, \`inline code\`, \`\`\`code blocks\`\`\`
- No filler phrases - go straight to analysis
- Point to the exact line in source code where the fix should be applied`;

function formatSingleIssueForAI(
  issue: DetectedIssue,
  sourceContext: string,
): string {
  const lines = [
    `Severity: ${issue.severity}`,
    `Category: ${issue.category}`,
    `Message: ${issue.message}`,
  ];
  if (issue.path) lines.push(`Path: ${issue.path}`);
  if (issue.foundValue !== undefined) {
    lines.push(
      `Value: ${issue.foundValue === null ? 'null' : String(issue.foundValue)}`,
    );
  }
  if (issue.source) lines.push(`Source: ${issue.source}`);
  if (issue.suggestion) lines.push(`Existing suggestion: ${issue.suggestion}`);
  if (issue.details) {
    for (const [key, value] of Object.entries(issue.details)) {
      lines.push(
        `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`,
      );
    }
  }
  if (issue.stack) {
    lines.push(`Stack trace:\n${issue.stack.split('\n').slice(0, 5).join('\n')}`);
  }
  if (sourceContext) {
    lines.push(`\n${sourceContext}`);
  }
  return lines.join('\n');
}

export async function analyzeSingleIssue(
  issue: DetectedIssue,
  model: AIModel,
): Promise<SingleIssueAIResult> {
  // Fetch source code context
  let sourceContext = '';
  try {
    sourceContext = await getSourceContextForIssue(issue);
  } catch {
    // proceed without source context
  }

  const userPrompt = `Analyze this runtime issue:\n\n${formatSingleIssueForAI(issue, sourceContext)}`;
  const { text, tokens } = await callAI(
    model,
    SINGLE_ISSUE_PROMPT,
    userPrompt,
    1024,
  );

  let result: SingleIssueAIResult;
  try {
    result = JSON.parse(text) as SingleIssueAIResult;
  } catch {
    result = {
      rootCause: text.slice(0, 500),
      fix: 'See raw analysis above.',
    };
  }

  result._model = model;
  result._tokens = tokens;
  return result;
}
