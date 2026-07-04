import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { KeyRound, Eye, EyeOff, Copy, Check, Plus } from "lucide-react";

const AMBER = "#f5c242";

export default function PartnerTokenCard({ user }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");

  const { data: partner, isLoading } = useQuery({
    queryKey: ["my-partner-config", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const rows = await base44.entities.PartnerConfig.filter({ partner_email: user.email }, "-created_date", 1);
      return rows[0] || null;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.PartnerConfig.create({
        partner_name: name.trim(),
        partner_email: user.email,
        embed_token: "abos_" + crypto.randomUUID().replace(/-/g, ""),
        brand_name: name.trim(),
        is_active: true,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-partner-config"] }),
  });

  const copy = () => {
    navigator.clipboard.writeText(partner.embed_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) return <div className="h-24 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />;

  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(245,194,66,0.05)", border: `0.5px solid rgba(245,194,66,0.22)` }}>
      <div className="flex items-center gap-2 mb-3">
        <KeyRound className="w-4 h-4" style={{ color: AMBER }} />
        <p className="text-sm font-black uppercase tracking-wide" style={{ color: AMBER }}>Your Partner Token</p>
      </div>

      {partner ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="px-3 py-2 rounded-lg text-xs flex-1 min-w-[200px]" style={{ background: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.85)", fontFamily: "'Courier Prime', monospace" }}>
            {visible ? partner.embed_token : "•".repeat(24)}
          </code>
          <button onClick={() => setVisible(!visible)} aria-label="Toggle visibility" className="p-2 rounded-lg touch-target-compact" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={copy} aria-label="Copy token" className="p-2 rounded-lg touch-target-compact" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            {copied ? <Check className="w-4 h-4" style={{ color: "#5dcaa5" }} /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your marketplace / company name"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase disabled:opacity-50"
            style={{ background: AMBER, color: "#04060a" }}
          >
            <Plus className="w-4 h-4" /> {createMutation.isPending ? "Creating…" : "Generate Token"}
          </button>
        </div>
      )}
      <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
        The token authenticates your marketplace against the ABOS Intelligence Exchange. Keep it secret — treat it like an API key.
      </p>
    </div>
  );
}