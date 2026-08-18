import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Copy, Check, ArrowRight } from "lucide-react";

const MCP_URL = "https://abos-widget-gateway.aircraftbuyorsell.workers.dev/mcp";

export default function AgentConnectCard() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 md:px-8 py-6">
      <div className="rounded-2xl p-5 md:p-6 bg-card border border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
                <Bot className="h-5 w-5 text-[#D4A017]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4A017]">AI Agent · MCP</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">Connect Claude, Cursor & ChatGPT</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Point your AI assistant at ABOS to search listings, value aircraft, and read market intelligence — via OAuth 2.1, no API key needed.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <button
              onClick={copy}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-left transition hover:opacity-90 border border-[#D4A017]/20 bg-[#D4A017]/[0.06] md:max-w-md"
            >
              <code className="text-xs font-mono break-all text-[#D4A017]">{MCP_URL}</code>
              <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <Link
              to="/connect"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #D4A017, #f48120)" }}
            >
              Full setup guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}