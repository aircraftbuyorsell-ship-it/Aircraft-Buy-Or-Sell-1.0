import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ChevronRight, Loader2, Send, Shield } from "lucide-react";
import useTypewriterPlaceholder from "@/hooks/useTypewriterPlaceholder";
import AircraftIdentityChip from "@/components/finance/AircraftIdentityChip";
import ConversationSidebar from "@/components/finance/ConversationSidebar";
import MessageBubble from "@/components/finance/MessageBubble";
import MobileConversationDrawer from "@/components/finance/MobileConversationDrawer";
import SkillPipelineChips from "@/components/finance/SkillPipelineChips";

const HINTS = [
  "Ask about any aircraft — try N758QV…",
  "Verify a registration before you fly out to see it…",
  "Is this aircraft still active? Ask St. Elmo…",
];
const REGEX = /\b(?:N\d{1,5}[A-Z]{0,2}|G-[A-Z]{4}|[A-Z]{1,2}-[A-Z]{2,5})\b/i;
const OPENERS = [
  "Verify N758QV",
  "What does an ATI score actually measure?",
  "Has N758QV been flying recently?",
];

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const failed = ["failed", "error"].includes(toolCall.status);
  const active = ["pending", "running", "in_progress"].includes(toolCall.status);
  const label = toolCall.display_projection?.label || toolCall.name || "Step";
  return <div className="ml-2 mt-2"><button onClick={() => setExpanded(!expanded)} className={`flex items-center gap-1 text-[11px] font-semibold ${failed ? "text-destructive" : active ? "text-gold" : "text-emerald-600 dark:text-emerald-400"}`}>{active && <Loader2 className="h-3 w-3 animate-spin" />}{failed && <AlertTriangle className="h-3 w-3" />}{!active && !failed && "✓"}{label}<ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>{expanded && <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">{JSON.stringify(toolCall.results || toolCall.arguments_string || {}, null, 2)}</pre>}</div>;
}

export default function StElmoChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [aircraft, setAircraft] = useState(null);
  const [error, setError] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const placeholder = useTypewriterPlaceholder(HINTS, { pauseMs: 3000 });
  const toolCalls = messages.flatMap(message => message.tool_calls || []);

  useEffect(() => { (async () => { const data = await base44.agents.listConversations({ q: { agent_name: "st_elmo" }, sort: "-created_date" }); setConversations((data || []).filter(conversation => !conversation.metadata?.archived)); setLoadingConversations(false); })(); }, []);
  useEffect(() => { if (!activeConversationId) return; return base44.agents.subscribeToConversation(activeConversationId, data => setMessages(data.messages || [])); }, [activeConversationId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const detectRegistration = value => value?.match(REGEX)?.[0]?.toUpperCase() || null;

  // Identity chip only — St. Elmo calls its own tools for the real data, so a
  // failed lookup here must never block the message from being sent.
  const loadIdentity = useCallback(async registration => {
    setAircraft({ registration });
    try {
      const res = await base44.functions.invoke("registryLookup", { registration });
      const found = res?.data?.aircraft;
      if (found) setAircraft({ registration, make: found.make || found.manufacturer, model: found.model, year: found.year });
    } catch { /* chip stays minimal */ }
  }, []);

  const ensureConversation = useCallback(async text => {
    const existing = conversations.find(item => item.id === activeConversationId);
    if (existing) return existing;
    const registration = detectRegistration(text);
    const conversation = await base44.agents.createConversation({
      agent_name: "st_elmo",
      metadata: { name: registration ? `${registration} · St. Elmo` : `${text.slice(0, 38)}…`, registration },
    });
    setActiveConversationId(conversation.id);
    setConversations(previous => [conversation, ...previous]);
    return conversation;
  }, [activeConversationId, conversations]);

  const sendMessage = useCallback(async override => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setError(""); setInput(""); setLoading(true);
    try {
      const registration = detectRegistration(text);
      if (registration && !aircraft) loadIdentity(registration);
      const conversation = await ensureConversation(text);
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } catch (err) {
      setError(err?.message || "Could not send that message. Try again.");
    } finally { setLoading(false); }
  }, [aircraft, ensureConversation, input, loadIdentity, loading]);

  const deleteConversation = async id => {
    const conversation = conversations.find(item => item.id === id);
    await base44.agents.updateConversation(id, { metadata: { ...(conversation?.metadata || {}), archived: true } });
    setConversations(previous => previous.filter(item => item.id !== id));
    if (id === activeConversationId) { setActiveConversationId(null); setMessages([]); setAircraft(null); }
  };
  const newConversation = () => { setActiveConversationId(null); setMessages([]); setAircraft(null); setError(""); };

  return <div className="min-h-screen bg-background md:flex">
    <ConversationSidebar conversations={conversations} activeId={activeConversationId} loading={loadingConversations} onNew={newConversation} onSelect={conversation => { setActiveConversationId(conversation.id); setMessages(conversation.messages || []); setAircraft(conversation.metadata?.registration ? { registration: conversation.metadata.registration } : null); }} onDelete={deleteConversation} />
    <main className="flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 md:hidden"><MobileConversationDrawer open={mobileDrawerOpen} conversations={conversations} onClose={setMobileDrawerOpen} onNew={newConversation} onSelect={conversation => { setActiveConversationId(conversation.id); setMessages(conversation.messages || []); }} onDelete={deleteConversation} /><Shield className="h-5 w-5 text-gold" /><span className="text-sm font-black text-foreground">St. Elmo</span></header>
      <section className="flex-1 overflow-y-auto px-4 py-5 md:px-6"><div className="mx-auto max-w-3xl space-y-4">
        {!messages.length && !loading ? <div className="space-y-6 py-10 text-center">
          <Shield className="mx-auto h-10 w-10 text-gold" />
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">St. Elmo</h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">Identify an aircraft, verify what a seller claims, or ask anything about an aviation transaction. St. Elmo points you to the right specialist when a question belongs to one.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {OPENERS.map(opener => <button key={opener} onClick={() => sendMessage(opener)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold hover:text-foreground">{opener}</button>)}
          </div>
        </div> : <>
          {aircraft && <AircraftIdentityChip aircraft={aircraft} />}
          {(loading || toolCalls.length > 0) && <SkillPipelineChips toolCalls={toolCalls} visible={loading} />}
          {messages.map((message, index) => <MessageBubble key={message.id || index} message={message} toolDisplay={(call, key) => <ToolCallDisplay key={key} toolCall={call} />} />)}
          {loading && <div className="flex items-center gap-2 px-2 font-mono text-xs text-gold"><Loader2 className="h-3.5 w-3.5 animate-spin" />Working…</div>}
        </>}
        {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<div ref={messagesEndRef} />
      </div></section>
      <footer className="border-t border-border bg-card p-3 md:p-4"><div className="mx-auto flex max-w-3xl items-end gap-2"><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={activeConversationId ? "Ask a follow-up question…" : placeholder} rows={1} className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-gold/30 focus:ring-2" /><button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-black disabled:opacity-40"><Send className="h-4 w-4" /></button></div></footer>
    </main>
  </div>;
}
