import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export function sanitizeMathDelimiters(input: string): string {
  if (!input) return '';
  let str = input;
  // Fix accidental nested $ inside braces like {$\pi$} or {$\frac{a}{b}$}
  for (let i = 0; i < 3; i++) {
    str = str.replace(/\{([^{}]*?)\$([^{}]*?)\$([^{}]*?)\}/g, '{$1$2$3}');
  }
  return str;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const sanitizedText = sanitizeMathDelimiters(text);

  // Check if text has LaTeX math delimiters ($...$ or $$...$$)
  const hasDelimiters = /\$\$[\s\S]+?\$\$|\$[^\$]+?\$/.test(sanitizedText);

  if (hasDelimiters) {
    // Split by block ($$...$$) and inline ($...$)
    const parts: React.ReactNode[] = [];
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sanitizedText)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`}>
            {sanitizedText.substring(lastIndex, match.index)}
          </span>
        );
      }

      const raw = match[0];
      const isBlock = raw.startsWith('$$') && raw.endsWith('$$');
      let math = isBlock ? raw.slice(2, -2).trim() : raw.slice(1, -1).trim();
      // Remove any lingering nested $ within the formula
      math = math.replace(/\$/g, '');

      try {
        const html = katex.renderToString(math, {
          displayMode: isBlock,
          throwOnError: false,
        });
        parts.push(
          <span
            key={`math-${match.index}`}
            className={isBlock ? 'block my-2 text-center' : 'inline-block px-1 align-baseline'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        parts.push(<span key={`fallback-${match.index}`}>{raw}</span>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sanitizedText.length) {
      parts.push(
        <span key={`txt-${lastIndex}`}>
          {sanitizedText.substring(lastIndex)}
        </span>
      );
    }

    return <span className={className}>{parts}</span>;
  }

  // If text starts with a LaTeX command like \frac, \sqrt, etc., render directly
  if (/^\\(frac|sqrt|sum|int|lim|alpha|beta|theta|pi|partial|mathbf|text|infty)/.test(text.trim())) {
    try {
      const html = katex.renderToString(text.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      return (
        <span
          className={`inline-block ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return <span className={className}>{text}</span>;
    }
  }

  // Plain text
  return <span className={className}>{text}</span>;
};
