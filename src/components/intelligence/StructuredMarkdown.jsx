import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Preprocesses agent output to convert [POSITIVE]...[/POSITIVE] and
 * [NEGATIVE]...[/NEGATIVE] tags into styled inline HTML spans.
 */
function preprocessSentimentTags(text) {
  if (!text) return text;
  return text
    .replace(
      /\[POSITIVE\]/g,
      '<span style="color:#5dcaa5;font-weight:600;">✓ '
    )
    .replace(/\[\/POSITIVE\]/g, "</span>")
    .replace(
      /\[NEGATIVE\]/g,
      '<span style="color:#e24b4a;font-weight:600;">⚠ '
    )
    .replace(/\[\/NEGATIVE\]/g, "</span>");
}

const markdownComponents = {
  h3: ({ children }) => (
    <h3
      className="text-white/90 font-extrabold mt-4 mb-2"
      style={{
        fontSize: "15px",
        fontWeight: 800,
        paddingLeft: "8px",
        borderLeft: "3px solid #f5c242",
      }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      className="text-white/75 font-bold mt-3 mb-1.5"
      style={{ fontSize: "13px", fontWeight: 700 }}
    >
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5
      className="text-white/55 font-semibold mb-1"
      style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </h5>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th
      className="text-left px-2 py-1.5 text-white/60 font-semibold"
      style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1.5 text-white/80 align-top">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="my-2 px-3 py-2 rounded-r-md"
      style={{
        borderLeft: "3px solid #f5c242",
        background: "rgba(245,194,66,0.06)",
      }}
    >
      <span className="text-white/80 text-[13px]">{children}</span>
    </blockquote>
  ),
  p: ({ children }) => <p className="text-white/85 text-sm mb-1.5">{children}</p>,
  ul: ({ children }) => <ul className="mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }) => (
    <li className="text-white/80 text-sm flex gap-1.5">
      <span className="text-white/30">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  code: ({ children }) => (
    <code
      className="px-1 rounded text-[#f5c242]"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {children}
    </code>
  ),
};

/**
 * Renders agent output with structured headings, tables, blockquotes,
 * and [POSITIVE]/[NEGATIVE] sentiment-colored spans.
 */
export default function StructuredMarkdown({ content }) {
  const processed = preprocessSentimentTags(content);
  return (
    <div className="text-sm">
      <ReactMarkdown components={markdownComponents} skipHtml={false}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}