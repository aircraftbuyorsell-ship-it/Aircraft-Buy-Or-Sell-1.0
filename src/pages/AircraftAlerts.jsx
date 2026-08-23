import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMemo, useState } from "react";
import { Bell, Plus, Trash2, CheckCircle2, Tag, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CHANNEL_LABELS = {
  email: "Email",
  in_app: "In-app",
  digest: "Daily digest",
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AircraftAlerts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["auth-me-alerts"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60000,
  });
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["aircraft-alerts"],
    queryFn: () => base44.entities.AircraftAlert.list("-created_date", 100),
    staleTime: 15000,
  });

  const [form, setForm] = useState({
    name: "",
    make: "",
    model: "",
    year_min: "",
    year_max: "",
    max_price: "",
    min_ati: "",
    deal_only: false,
    channel: "email",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.AircraftAlert.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aircraft-alerts"] });
      toast({ title: "Alert created", description: "We'll notify you when a matching deal appears." });
      setForm({
        name: "",
        make: "",
        model: "",
        year_min: "",
        year_max: "",
        max_price: "",
        min_ati: "",
        deal_only: false,
        channel: "email",
      });
    },
    onError: (e) => toast({ title: "Could not create alert", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }) => base44.entities.AircraftAlert.update(id, { active: !active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aircraft-alerts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.AircraftAlert.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aircraft-alerts"] });
      toast({ title: "Alert removed" });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      toast({ title: "Please log in to create alerts", variant: "destructive" });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: "Give your alert a name", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      user_email: user.email,
      name: form.name.trim(),
      make: form.make.trim() || undefined,
      model: form.model.trim() || undefined,
      year_min: form.year_min ? Number(form.year_min) : undefined,
      year_max: form.year_max ? Number(form.year_max) : undefined,
      max_price: form.max_price ? Number(form.max_price) : undefined,
      min_ati: form.min_ati ? Number(form.min_ati) : undefined,
      deal_only: !!form.deal_only,
      channel: form.channel,
      active: true,
    };
    createMutation.mutate(payload, { onSettled: () => setSubmitting(false) });
  };

  const summary = useMemo(() => {
    const active = alerts.filter((a) => a.active).length;
    const totalMatches = alerts.reduce((s, a) => s + (a.matches_count || 0), 0);
    return { active, total: alerts.length, totalMatches };
  }, [alerts]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 md:px-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Aircraft Watch
          </p>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Track models &amp; get deal alerts
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Set up alerts for specific aircraft models. We'll email you the moment a new
            listing matching your criteria appears at a good price.
          </p>
          <div className="mt-4 flex gap-4 text-[12px]">
            <span className="font-semibold">
              <span className="text-primary">{summary.active}</span>
              <span className="text-muted-foreground"> active</span>
            </span>
            <span className="font-semibold">
              <span className="text-foreground">{summary.total}</span>
              <span className="text-muted-foreground"> total</span>
            </span>
            <span className="font-semibold">
              <span className="text-primary">{summary.totalMatches}</span>
              <span className="text-muted-foreground"> matches sent</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {/* Create form */}
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wide">New alert</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Alert name
              </label>
              <input
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Cessna 172 under $90k"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Make
              </label>
              <input
                value={form.make}
                onChange={update("make")}
                placeholder="Cessna"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Model
              </label>
              <input
                value={form.model}
                onChange={update("model")}
                placeholder="172"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Year from
              </label>
              <input
                type="number"
                value={form.year_min}
                onChange={update("year_min")}
                placeholder="2000"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Year to
              </label>
              <input
                type="number"
                value={form.year_max}
                onChange={update("year_max")}
                placeholder="2024"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Max price (USD)
              </label>
              <input
                type="number"
                value={form.max_price}
                onChange={update("max_price")}
                placeholder="90000"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Min ATI score
              </label>
              <input
                type="number"
                value={form.min_ati}
                onChange={update("min_ati")}
                placeholder="60"
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Channel
              </label>
              <select
                value={form.channel}
                onChange={update("channel")}
                className="w-full rounded-lg border border-input bg-input px-3 py-2 text-sm text-foreground"
              >
                <option value="email">Email</option>
                <option value="in_app">In-app</option>
                <option value="digest">Daily digest</option>
              </select>
            </div>
          </div>

          <label className="mt-4 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.deal_only}
              onChange={(e) => setForm((f) => ({ ...f, deal_only: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold">Good deals only</span>
            <span className="text-muted-foreground">— notify me only when the listing is priced below market value</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            <Bell className="h-4 w-4" /> Create alert
          </button>
        </form>

        {/* Alerts list */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">No alerts yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first alert above to get notified when a matching aircraft hits the market.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border bg-card p-4 transition-opacity ${
                  a.active ? "border-border" : "border-border opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold">{a.name}</h3>
                      {a.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          Paused
                        </span>
                      )}
                      {a.deal_only && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          <Zap className="h-3 w-3" /> Deals only
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[12px] text-muted-foreground">
                      {[a.make && a.make, a.model && a.model].filter(Boolean).join(" ") || "Any model"}
                      {(a.year_min || a.year_max) && (
                        <> · {a.year_min || "—"}–{a.year_max || "—"}</>
                      )}
                      {a.max_price && <> · max ${a.max_price.toLocaleString()}</>}
                      {a.min_ati && <> · ATI ≥ {a.min_ati}</>}
                      <> · {CHANNEL_LABELS[a.channel] || a.channel}</>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span>
                        <Tag className="mr-1 inline h-3 w-3" />
                        {a.matches_count || 0} matches
                      </span>
                      <span>Last match: {fmtDate(a.last_matched_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: a.id, active: a.active })}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-muted"
                    >
                      {a.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(a.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}