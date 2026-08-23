import AgentConnectInstructions from "@/components/coreapi/AgentConnectInstructions";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";

export default function AgentConnect() {
  return (
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24 text-foreground">
      <div className="max-w-[980px] mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Bot size={12} style={{ color: "#f5c242" }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#D4A017]">
              MCP · Model Context Protocol
            </span>
          </div>
          <h1 className="tracking-[-0.03em] leading-[1.06] mb-4 text-3xl md:text-5xl font-bold text-foreground">
            Connect your AI agent to <span style={{ color: "#D4A017" }}>ABOS</span>
          </h1>
          <p className="text-[14px] leading-relaxed max-w-[600px] text-muted-foreground">
            Point Claude, Cursor, or ChatGPT at the ABOS MCP endpoint and your assistant can search listings,
            value aircraft, and read market intelligence — all through your ABOS account.
          </p>
        </div>

        <AgentConnectInstructions />
      </div>
    </div>
  );
}