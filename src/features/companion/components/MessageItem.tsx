import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/core/components/shadcn/button";
import type { CompanionMessage } from "../types/companion.types";

interface MessageItemProps {
  message: Pick<CompanionMessage, "id" | "role" | "content">;
  incomplete?: boolean;
}

function renderInline(text: string, keyPrefix: string) {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const output: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;
  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) output.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${tokenIndex++}`;
    if (token.startsWith("**") || token.startsWith("__")) {
      output.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      output.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      output.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) output.push(text.slice(lastIndex));
  return output;
}

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isListLine(line: string) {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function renderMarkdown(content: string) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`code-${index}`}><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) rows.push(tableCells(lines[index++]));
      blocks.push(
        <div className="companion-table-wrap" key={`table-${index}`}>
          <table>
            <thead><tr>{headers.map((cell, cellIndex) => <th key={`h-${cellIndex}`}>{renderInline(cell, `th-${cellIndex}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => (
              <tr key={`r-${rowIndex}`}>
                {headers.map((_, cellIndex) => <td key={`c-${cellIndex}`}>{renderInline(row[cellIndex] ?? "", `td-${rowIndex}-${cellIndex}`)}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      const text = heading[2];
      const key = `heading-${index++}`;
      if (level === 2) blocks.push(<h2 key={key}>{renderInline(text, key)}</h2>);
      else if (level === 3) blocks.push(<h3 key={key}>{renderInline(text, key)}</h3>);
      else if (level === 4) blocks.push(<h4 key={key}>{renderInline(text, key)}</h4>);
      else if (level === 5) blocks.push(<h5 key={key}>{renderInline(text, key)}</h5>);
      else blocks.push(<h6 key={key}>{renderInline(text, key)}</h6>);
      continue;
    }

    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quoteLines.push(lines[index++].replace(/^\s*>\s?/, ""));
      const key = `quote-${index}`;
      blocks.push(<blockquote key={key}>{quoteLines.map((quoteLine, quoteIndex) => <p key={quoteIndex}>{renderInline(quoteLine, `${key}-${quoteIndex}`)}</p>)}</blockquote>);
      continue;
    }

    if (isListLine(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      const matcher = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
      while (index < lines.length && isListLine(lines[index]) && /^\s*\d+[.)]\s+/.test(lines[index]) === ordered) {
        items.push(lines[index++].replace(matcher, ""));
      }
      const key = `list-${index}`;
      blocks.push(ordered
        ? <ol key={key}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</ol>
        : <ul key={key}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</ul>);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^\s*```/.test(lines[index]) && !/^#{1,6}\s/.test(lines[index]) && !isListLine(lines[index])) {
      if (index + 1 < lines.length && lines[index].includes("|") && isTableSeparator(lines[index + 1])) break;
      paragraph.push(lines[index++]);
    }
    if (paragraph.length) {
      const key = `paragraph-${index}`;
      blocks.push(<p key={key}>{paragraph.map((part, partIndex) => <span key={partIndex}>{partIndex > 0 ? <br /> : null}{renderInline(part, `${key}-${partIndex}`)}</span>)}</p>);
    } else {
      blocks.push(<p key={`plain-${index}`}>{renderInline(lines[index], `plain-${index}`)}</p>);
      index += 1;
    }
  }

  return blocks;
}

export function MessageItem({ message, incomplete = false }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "ASSISTANT";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className={`companion-message ${isAssistant ? "companion-message-assistant" : "companion-message-user"}`}>
      <div className="companion-message-heading">{isAssistant ? "Engo" : "Bạn"}</div>
      <div className="companion-message-content">{renderMarkdown(message.content)}</div>
      {incomplete ? <p className="companion-incomplete-label">Phản hồi chưa hoàn tất</p> : null}
      {isAssistant ? (
        <Button type="button" variant="ghost" size="sm" className="companion-copy-button" onClick={() => void copyMessage()}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Đã sao chép" : "Sao chép"}
        </Button>
      ) : null}
    </article>
  );
}
