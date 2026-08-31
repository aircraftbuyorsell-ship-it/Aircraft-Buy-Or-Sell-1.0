import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Brain, ChevronRight, Loader2, Send } from "lucide-react";
import useTypewriterPlaceholder from "@/hooks/useTypewriterPlaceholder";
import AircraftIdentityChip from "@/components/finance/AircraftIdentityChip";
import ConversationSidebar from "@/components/finance/ConversationSidebar";
import FinanceHero from "@/components/finance/FinanceHero";
import MessageBubble from "@/components/finance/MessageBubble";
import MobileConversationDrawer from "@/components/finance/MobileConversationDrawer";
import SkillPipelineChips from "@/components/finance/SkillPipelineChips";

const HINTS = ["Enter N123AB to run a full ABOS aircraft analysis…", "Ask for valuation, market report, or investment briefing…", "Try OPEX, insurance, leasing, upgrade, or service intelligence…"];
const REGEX = /\b(?:N\d{1,5}[A-Z]{0,2}|G-[A-Z]{4}|[A-Z]{1,2}-[A-Z]{2,5})\b/i;

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const failed = ["failed", "error"].includes(toolCall.status);
  const active = ["pending", "running", "in_progress"].includes(toolCall.status);
  const label = toolCall.display_projection?.label || toolCall.name || "Skill";
  return <div className="ml-2 mt-2"><button onClick={() => setExpanded(!expanded)} className={`flex items-center gap-1 text-[11px] font-semibold ${failed ? "text-destructive" : active ? "text-gold" : "text-emerald-600 dark:text-emerald-400"}`}>{active && <Loader2 className="h-3 w-3 animate-spin" />}{failed && <AlertTriangle className="h-3 w-3" />}{!active && !failed && "✓"}{label}<ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>{expanded && <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">{JSON.stringify(toolCall.results || toolCall.arguments_string || {}, null, 2)}</pre>}</div>;
}

export default function FinanceAdvisorChat() {
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

  useEffect(() => { (async () => { const data = await base44.agents.listConversations({ agent_name: "finance_advisor" }); setConversations((data || []).filter(conversation => !conversation.metadata?.archived)); setLoadingConversations(false); })(); }, []);
  useEffect(() => { if (!activeConversationId) return; return base44.agents.subscribeToConversation(activeConversationId, data => setMessages(data.messages || [])); }, [activeConversationId]);
  useEffect(() => {
    const onVerificationHandoff = event => {
      const data = event.detail || {};
      const registration = data.registration || data.digitalTwin?.registration;
      if (!registration) return;
      setAircraft({ registration, make: data.modules?.registry?.manufacturer, model: data.modules?.registry?.model, year: data.modules?.registry?.year, ati_score: data.ati_score });
      setInput(data.handoff?.prompt || `Analyse ${registration} using the completed verification context.`);
    };
    window.addEventListener('abos:assistant-handoff', onVerificationHandoff);
    return () => window.removeEventListener('abos:assistant-handoff', onVerificationHandoff);
  }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const detectRegistration = value => value?.match(REGEX)?.[0]?.toUpperCase() || null;
  const loadDigitalTwin = useCallback(async registration => {
    const [twin, hub] = await Promise.allSettled([base44.functions.invoke("initDigitalTwin", { registration }), base44.functions.invoke("aircraftDataHub", { registration })]);
    const twinData = twin.status === "fulfilled" ? twin.value?.data : null;
    const hubData = hub.status === "fulfilled" ? hub.value?.data : null;
    setAircraft({ registration, make: hubData?.aircraft?.make, model: hubData?.aircraft?.model, year: hubData?.aircraft?.year || twinData?.providers?.faa_registry?.year, ati_score: hubData?.ati_score });
  }, []);

  const ensureConversation = useCallback(async text => {
    let conversation = conversations.find(item => item.id === activeConversationId);
    if (conversation) return conversation;
    const registration = detectRegistration(text);
    conversation = await base44.agents.createConversation({ agent_name: "finance_advisor", metadata: { name: registration ? `${registration} · Investment Analysis` : `${text.slice(0, 38)}…`, registration } });
    setActiveConversationId(conversation.id); setConversations(previous => [conversation, ...previous]);
    return conversation;
  }, [activeConversationId, conversations]);

  const sendMessage = useCallback(async override => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setError(""); setInput(""); setLoading(true);
    try {
      const registration = detectRegistration(text);
      if (!activeConversationId && !registration) { setError("Your first message must include an aircraft registration or an FAA registry PDF."); return; }
      if (!activeConversationId && registration) await loadDigitalTwin(registration);
      const conversation = await ensureConversation(text);
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } finally { setLoading(false); }
  }, [activeConversationId, ensureConversation, input, loadDigitalTwin, loading]);

  const handlePdf = useCallback(async file => {
    if (!file) return; setError(""); setLoading(true);
    try {
      const content = await file.text(); const registration = detectRegistration(content);
      if (!registration) { setError("No FAA N-number was found in this PDF. Please enter the registration manually."); return; }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setInput(registration); await loadDigitalTwin(registration);
      const conversation = await ensureConversation(`${registration} · Analyze investment potential from uploaded FAA registry PDF.`);
      await base44.agents.addMessage(conversation, { role: "user", content: `${registration} · Analyze investment potential from uploaded FAA registry PDF.`, file_urls: [file_url] });
    } finally { setLoading(false); }
  }, [ensureConversation, loadDigitalTwin]);

  const deleteConversation = async id => { const conversation = conversations.find(item => item.id === id); await base44.agents.updateConversation(id, { metadata: { ...(conversation?.metadata || {}), archived: true } }); setConversations(previous => previous.filter(item => item.id !== id)); if (id === activeConversationId) { setActiveConversationId(null); setMessages([]); setAircraft(null); } };
  const newConversation = () => { setActiveConversationId(null); setMessages([]); setAircraft(null); setError(""); };

  return <div className="min-h-screen bg-background md:flex">
    <ConversationSidebar conversations={conversations} activeId={activeConversationId} loading={loadingConversations} onNew={newConversation} onSelect={conversation => { setActiveConversationId(conversation.id); setMessages(conversation.messages || []); setAircraft(conversation.metadata?.registration ? { registration: conversation.metadata.registration } : null); }} onDelete={deleteConversation} />
    <main className="flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3 md:hidden"><MobileConversationDrawer open={mobileDrawerOpen} conversations={conversations} onClose={setMobileDrawerOpen} onNew={newConversation} onSelect={conversation => { setActiveConversationId(conversation.id); setMessages(conversation.messages || []); }} onDelete={deleteConversation} /><Brain className="h-5 w-5 text-gold" /><span className="text-sm font-black text-foreground">ABOS Assistant</span></header>
      <section className="flex-1 overflow-y-auto px-4 py-5 md:px-6"><div className="mx-auto max-w-3xl space-y-4">
        {!messages.length && !loading ? <FinanceHero input={input} placeholder={placeholder} onChange={setInput} onSubmit={() => sendMessage()} onScenario={scenario => setInput(`${input ? `${input} · ` : ""}${scenario}`)} onFile={handlePdf} /> : <>
          {aircraft && <AircraftIdentityChip aircraft={aircraft} />}
          {(loading || toolCalls.length > 0) && <SkillPipelineChips toolCalls={toolCalls} visible={loading} />}
          {messages.map((message, index) => <MessageBubble key={message.id || index} message={message} toolDisplay={(call, key) => <ToolCallDisplay key={key} toolCall={call} />} />)}
          {loading && <div className="flex items-center gap-2 px-2 font-mono text-xs text-gold"><Loader2 className="h-3.5 w-3.5 animate-spin" />Initializing your analysis…</div>}
        </>}
        {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<div ref={messagesEndRef} />
      </div></section>
      <footer className="border-t border-border bg-card p-3 md:p-4"><div className="mx-auto flex max-w-3xl items-end gap-2"><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={activeConversationId ? "Ask a follow-up question…" : placeholder} rows={1} className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-gold/30 focus:ring-2" /><button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-black disabled:opacity-40"><Send className="h-4 w-4" /></button></div></footer>
    </main>
  </div>;
}