import { useState } from "react";
import { Bot, Copy, Check, Sparkles, MousePointerClick, FileCode2 } from "lucide-react";
import ApiDocBlock from "@/components/integration/ApiDocBlock";

const MCP_URL = "https://abos-widget-gateway.aircraftbuyorsell.workers.dev/mcp";

const claudeDesktopSnippet = `{
  "mcpServers": {
    "abos-marketspace": {
      "url": "${MCP_URL}"
    }
  }
}`;

const cursorSnippet = `# Cursor → Settings → MCP → Add new MCP Server
# Server name: abos-marketspace
# Type: HTTP
# URL: ${MCP_URL}`;

const claudeCliSnippet = `# Claude Code CLI — run once, persists across sessions
claude mcp add --transport http abos-marketspace ${MCP_URL}`;

function StepRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: "#f5c242" }} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.90)" }}>{title}</p>
        <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{children}</div>
      </div>
    </div>
  );
}

function CopiableUrl() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="mt-3 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-90"
      style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.20)" }}
    >
      <code className="text-xs sm:text-sm font-mono break-all" style={{ color: "#f5c242" }}>{MCP_URL}</code>
      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
        style={{ color: copied ? "#7dd87d" : "rgba(255,255,255,0.45)" }}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

export default function AgentConnectInstructions() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={15} style={{ color: "#f5c242" }} />
        <h2 className="text-[16px] font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>Connect your AI agent</h2>
      </div>
      <p className="text-[13px] leading-relaxed max-w-[620px] mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
        ABOS speaks the Model Context Protocol (MCP). Point Claude, Cursor, or ChatGPT at the endpoint below and your
        assistant can search listings, value aircraft, and read market intelligence — all through your ABOS account.
        Authentication is handled by OAuth 2.1 (PKCE): on first use your agent opens a browser window, you approve,
        and a scoped session is issued. No API key to paste.
      </p>

      <CopiableUrl />

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-4 mt-5 mb-6">
        <StepRow icon={MousePointerClick} title="1 · Add the server">
          Paste the MCP URL into your agent's server config (examples below).
        </StepRow>
        <StepRow icon={Sparkles} title="2 · Approve once">
          On first call, your agent opens a consent screen — sign in with your ABOS account to grant scoped access.
        </StepRow>
        <StepRow icon={FileCode2} title="3 · Ask naturally">
          "Find a Cessna 172 under $180k in Europe" or "Value a 2018 Cirrus SR22" — the agent calls ABOS tools directly.
        </StepRow>
      </div>

      {/* Config snippets */}
      <div className="space-y-4">
        <ApiDocBlock
          title="Claude Desktop"
          description="Add to ~/Library/Application Support/Claude/claude_desktop_config.json (macOS) or %APPDATA%\\Claude\\claude_desktop_config.json (Windows), then restart Claude."
          code={claudeDesktopSnippet}
        />
        <ApiDocBlock
          title="Cursor"
          description="Settings → MCP → Add new MCP Server. Choose HTTP transport and paste the URL."
          code={cursorSnippet}
        />
        <ApiDocBlock
          title="Claude Code (CLI)"
          description="Run once — the server persists across sessions and projects."
          code={claudeCliSnippet}
        />
      </div>

      <p className="mt-5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
        Scopes granted: <code style={{ color: "rgba(255,255,255,0.60)" }}>search:read</code>,{" "}
        <code style={{ color: "rgba(255,255,255,0.60)" }}>intelligence:read</code>,{" "}
        <code style={{ color: "rgba(255,255,255,0.60)" }}>listing:read</code>. Revoke access anytime from your ABOS account.
      </p>
    </div>
  );
}