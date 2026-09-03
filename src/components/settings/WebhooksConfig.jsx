import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Webhook, Plus, Trash2, Send, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Copy, Eye, EyeOff, Pencil,
} from "lucide-react";

const ALL_EVENTS = [
  { group: "Listings", events: ["listing.created", "listing.updated", "listing.sold"] },
  { group: "ATI / Scoring", events: ["ati.generated", "deal_radar.scored"] },
  { group: "Escrow", events: ["escrow.created", "escrow.status_changed", "escrow.closed"] },
  { group: "Leads", events: ["lead.created", "lead.stage_changed"] },
  { group: "Market Reports", events: ["market_report.generated"] },
  { group: "Traffic", events: ["traffic.snapshot_refreshed"] },
  { group: "Affiliate", events: ["affiliate.click", "affiliate.lead", "affiliate.conversion"] },
];

const FLAT_EVENTS = ALL_EVENTS.flatMap(g => g.events);

function EventPicker({ selected, onChange }) {
  return (
    <div className="space-y-3">
      {ALL_EVENTS.map(({ group, events }) => (
        <div key={group}>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#AAA49C] mb-1.5">{group}</p>
          <div className="flex flex-wrap gap-1.5">
            {events.map(ev => {
              const active = selected.includes(ev);
              return (
                <button
                  key={ev}
                  type="button"
                  onClick={() => onChange(active ? selected.filter(e => e !== ev) : [...selected, ev])}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    active
                      ? "bg-[#0B2D5B] text-white border-[#0B2D5B]"
                      : "bg-white text-[#6B6560] border-black/10 hover:border-[#0B2D5B]/30"
                  }`}
                >
                  {ev}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WebhookForm({ initial, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    url: initial?.url || "",
    secret: initial?.secret || "",
    events: initial?.events || [],
    is_active: initial?.is_active ?? true,
  });
  const [showSecret, setShowSecret] = useState(false);

  const valid = form.name.trim() && form.url.trim().startsWith("http") && form.events.length > 0;

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-[#0B2D5B]/15 bg-[#F7F4EF]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Zapier Integration"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2D5B]"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">URL *</label>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://hooks.zapier.com/..."
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-[#0B2D5B]"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-1">
          Secret (optional — enables HMAC-SHA256 signature)
        </label>
        <div className="relative">
          <input
            value={form.secret}
            onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            type={showSecret ? "text" : "password"}
            placeholder="your-webhook-secret"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 pr-9 text-sm font-mono outline-none focus:border-[#0B2D5B]"
          />
          <button type="button" onClick={() => setShowSecret(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA49C] hover:text-[#0B2D5B]">
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-[#6B6560] block mb-2">
          Events to subscribe to *
        </label>
        <EventPicker selected={form.events} onChange={evs => setForm(f => ({ ...f, events: evs }))} />
        {form.events.length === 0 && (
          <p className="text-[11px] text-red-500 mt-1">Select at least one event.</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          <span className="text-sm font-semibold text-[#1A1814]">Active</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            disabled={!valid || isSaving}
            onClick={() => onSave(form)}
            style={{ background: "linear-gradient(135deg,#0B2D5B,#143C75)" }}
            className="text-white font-bold"
          >
            {isSaving ? "Saving…" : initial ? "Update" : "Create Webhook"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WebhookRow({ wh, onToggle, onDelete, onTest, onEdit, testing }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = wh.last_status
    ? wh.last_status >= 200 && wh.last_status < 300
      ? "text-green-600"
      : "text-red-500"
    : "text-[#AAA49C]";

  return (
    <div className={`rounded-2xl border transition-all ${wh.is_active ? "border-black/[0.07] bg-white" : "border-dashed border-black/10 bg-white/50 opacity-70"}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${wh.is_active ? "bg-green-400" : "bg-gray-300"}`}
          style={wh.is_active ? { boxShadow: "0 0 6px rgba(74,222,128,0.7)" } : {}} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0B2D5B] text-sm truncate">{wh.name}</p>
          <p className="text-[11px] text-[#AAA49C] font-mono truncate">{wh.url}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {wh.last_status ? (
            <span className={`text-[11px] font-bold ${statusColor}`}>
              {wh.last_status >= 200 && wh.last_status < 300
                ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />
                : <XCircle className="w-3.5 h-3.5 inline mr-0.5" />}
              {wh.last_status}
            </span>
          ) : (
            <span className="text-[11px] text-[#AAA49C] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Never
            </span>
          )}
          <Badge variant="outline" className="text-[10px]">
            {wh.trigger_count || 0} sent
          </Badge>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Switch checked={wh.is_active} onCheckedChange={() => onToggle(wh)} />
          <button onClick={() => onEdit(wh)} className="p-1.5 rounded-lg hover:bg-black/05 text-[#6B6560] hover:text-[#0B2D5B] transition">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTest(wh)}
            disabled={testing === wh.id}
            className="p-1.5 rounded-lg hover:bg-[#E8A83A]/10 text-[#E8A83A] hover:text-[#D4A017] transition disabled:opacity-50"
            title="Send test event"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-black/05 text-[#6B6560] transition">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(wh)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-black/[0.05] pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#AAA49C] mb-1.5">Subscribed Events</p>
            <div className="flex flex-wrap gap-1.5">
              {(wh.events || []).map(ev => (
                <span key={ev} className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#0B2D5B]/08 text-[#0B2D5B]">{ev}</span>
              ))}
            </div>
          </div>
          {wh.last_triggered_at && (
            <p className="text-[11px] text-[#AAA49C]">
              Last triggered: {new Date(wh.last_triggered_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function WebhooksConfig() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["webhook-configs"],
    queryFn: () => base44.entities.WebhookConfig.list("-created_date", 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WebhookConfig.create({ ...data, trigger_count: 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["webhook-configs"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WebhookConfig.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["webhook-configs"] }); setEditingWh(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WebhookConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhook-configs"] }),
  });

  const handleToggle = (wh) =>
    updateMutation.mutate({ id: wh.id, data: { is_active: !wh.is_active } });

  const handleDelete = (wh) => {
    if (confirm(`Delete webhook "${wh.name}"?`)) deleteMutation.mutate(wh.id);
  };

  const handleTest = async (wh) => {
    setTesting(wh.id);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("dispatchWebhook", {
        webhook_id: wh.id,
        event_type: wh.events?.[0] || "test.ping",
        payload: { test: true, webhook_name: wh.name },
      });
      const result = res.data?.results?.[0];
      setTestResult({ success: result?.success, status: result?.status, name: wh.name });
    } catch (e) {
      setTestResult({ success: false, status: 0, name: wh.name });
    } finally {
      setTesting(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <div className="glass-card p-7">
      {/* Section header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
          <Webhook className="w-5 h-5 text-[#E8A83A]" />
        </div>
        <div className="flex-1">
          <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
            Webhooks
          </h2>
          <p className="text-sm text-[#6B6560] mt-1">
            Trigger external services or automate workflows when events occur in ABOS. Payloads are sent as POST requests with an optional HMAC-SHA256 signature.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setShowForm(true); setEditingWh(null); }}
          className="shrink-0 font-bold text-white"
          style={{ background: "linear-gradient(135deg,#0B2D5B,#143C75)" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Webhook
        </Button>
      </div>

      {/* Test result toast */}
      {testResult && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
          testResult.success ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {testResult.success
            ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
          {testResult.success
            ? `Test delivered to "${testResult.name}" (HTTP ${testResult.status})`
            : `Test failed for "${testResult.name}" (HTTP ${testResult.status || "timeout"})`}
        </div>
      )}

      {/* Create form */}
      {showForm && !editingWh && (
        <div className="mb-5">
          <WebhookForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSaving={createMutation.isPending}
          />
        </div>
      )}

      {/* Webhook list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 rounded-2xl bg-black/[0.04] animate-pulse" />)}
        </div>
      ) : webhooks.length === 0 && !showForm ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-black/10">
          <Webhook className="w-8 h-8 text-[#AAA49C] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#6B6560]">No webhooks configured</p>
          <p className="text-xs text-[#AAA49C] mt-1">Add a webhook to start automating workflows.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map(wh =>
            editingWh?.id === wh.id ? (
              <WebhookForm
                key={wh.id}
                initial={wh}
                onSave={(data) => updateMutation.mutate({ id: wh.id, data })}
                onCancel={() => setEditingWh(null)}
                isSaving={updateMutation.isPending}
              />
            ) : (
              <WebhookRow
                key={wh.id}
                wh={wh}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onTest={handleTest}
                onEdit={(w) => { setEditingWh(w); setShowForm(false); }}
                testing={testing}
              />
            )
          )}
        </div>
      )}

      {/* Docs hint */}
      <div className="mt-5 p-3 rounded-xl bg-[#0B2D5B]/04 border border-[#0B2D5B]/08 text-[11px] text-[#6B6560] space-y-1">
        <p><strong className="text-[#0B2D5B]">Signature verification:</strong> If a secret is set, each request includes an <code className="font-mono bg-black/05 px-1 rounded">X-ABOS-Signature: sha256=...</code> header.</p>
        <p><strong className="text-[#0B2D5B]">Payload format:</strong> <code className="font-mono bg-black/05 px-1 rounded">{`{ "event": "listing.created", "timestamp": "...", "data": {...} }`}</code></p>
      </div>
    </div>
  );
}