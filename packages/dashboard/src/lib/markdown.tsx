import React, { type ReactNode } from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Parse inline markdown: **bold** and `code` */
function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Combined regex for bold and inline code
  const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++}>{escapeHtml(match[2])}</strong>);
    } else if (match[3]) {
      // `inline code`
      parts.push(
        <code key={key++} className="md-inline-code">
          {escapeHtml(match[3])}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : [escapeHtml(text)];
}

/** Parse a block of text into paragraph/list elements */
function parseBlock(block: string, blockKey: number): ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  const lines = trimmed.split('\n');

  // Check if this is a list block
  const isUnordered = lines.every((l) => /^\s*[-*]\s/.test(l));
  const isOrdered = lines.every((l) => /^\s*\d+\.\s/.test(l));

  if (isUnordered) {
    return (
      <ul key={blockKey}>
        {lines.map((line, i) => (
          <li key={i}>{parseInline(line.replace(/^\s*[-*]\s+/, ''))}</li>
        ))}
      </ul>
    );
  }

  if (isOrdered) {
    return (
      <ol key={blockKey}>
        {lines.map((line, i) => (
          <li key={i}>{parseInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>
        ))}
      </ol>
    );
  }

  // Regular paragraph - join lines with <br/>
  return (
    <p key={blockKey}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {parseInline(line)}
        </React.Fragment>
      ))}
    </p>
  );
}

export function Markdown({
  content,
  className,
}: {
  content: string | undefined | null;
  className?: string;
}): ReactNode {
  if (!content) return null;

  const elements: ReactNode[] = [];
  let key = 0;

  // Split by code block fences first
  const segments = content.split(/(```[\s\S]*?```)/g);

  for (const segment of segments) {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      // Code block
      const inner = segment.slice(3, -3);
      const nlIndex = inner.indexOf('\n');
      // First line might be the language identifier
      const hasLang = nlIndex > 0 && nlIndex < 20 && !/\s/.test(inner.slice(0, nlIndex));
      const code = hasLang ? inner.slice(nlIndex + 1) : inner;

      elements.push(
        <pre key={key++} className="md-code-block">
          <code>{code}</code>
        </pre>,
      );
    } else {
      // Regular text - split by double newlines for paragraphs
      const blocks = segment.split(/\n{2,}/);
      for (const block of blocks) {
        const node = parseBlock(block, key++);
        if (node) elements.push(node);
      }
    }
  }

  return (
    <div className={`md-content${className ? ` ${className}` : ''}`}>
      {elements}
    </div>
  );
}
