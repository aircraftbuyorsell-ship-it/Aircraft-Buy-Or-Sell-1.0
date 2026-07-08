import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Key, Plus, Copy, Check, Trash2, Loader2 } from "lucide-react";

const ALL_SCOPES = ["listing:read", "listing:write", "search:read", "intelligence:read"];
const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

export default function ApiKeysPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(["listing:read", "search:read", "intelligence:read"]);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["abos-api-keys"],
    queryFn: async () => {
      const res = await base44.functions.invoke("abosCoreApi", { endpoint: "keys.list" });
      return res.data?.data?.keys || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("abosCoreApi", {
        endpoint: "keys.create",
        params: { name, scopes },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setNewKey(data);
      setName("");
      qc.invalidateQueries({ queryKey: ["abos-api-keys"] });
    },
  });

  const revokeMut = useMutation({
    mutationFn: async (id) => {
      await base44.functions.invoke("abosCoreApi", { endpoint: "keys.revoke", params: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["abos-api-keys"] }),
  });

  const toggleScope = (s) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const copyKey = async () => {
    await navigator.clipboard.writeText(newKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ ...card, padding: 24 }}>
      <div className="flex items-center gap-2.5 mb-5">
        <Key size={16} style={{ color: "#f5c242" }} />
        <h2 className="text-[15px] font-bold m-0" style={{ color: "rgba(255,255,255,0.92)" }}>API Keys</h2>
      </div>

      {/* Create form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. ChatGPT App)"
          className="flex-1 rounded-lg px-3.5 py-2.5 text-[13px] outline-none"
        />
        <button
          onClick={() => createMut.mutate()}
          disabled={!name.trim() || !scopes.length || createMut.isPending}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
          style={{ background: "#f5c242", color: "#04060a", border: "none", cursor: "pointer" }}
        >
          {createMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Generate Key
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {ALL_SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => toggleScope(s)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide touch-target-compact"
            style={{
              background: scopes.includes(s) ? "rgba(245,194,66,0.12)" : "rgba(255,255,255,0.04)",
              border: scopes.includes(s) ? "1px solid rgba(245,194,66,0.40)" : "1px solid rgba(255,255,255,0.08)",
              color: scopes.includes(s) ? "#f5c242" : "rgba(255,255,255,0.45)",
              cursor: "pointer", minHeight: 30,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Newly created key — shown once */}
      {newKey && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: "rgba(93,202,165,0.07)", border: "1px solid rgba(93,202,165,0.25)" }}>
          <p className="text-[11px] font-bold m-0 mb-2" style={{ color: "#5dcaa5" }}>
            Key created — copy it now, it will not be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12px] px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap"
              style={{ background: "rgba(0,0,0,0.35)", color: "#5dcaa5", border: "1px solid rgba(93,202,165,0.2)" }}>
              {newKey.api_key}
            </code>
            <button onClick={copyKey} aria-label="Copy key"
              className="p-2.5 rounded-lg touch-target-compact"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#5dcaa5" : "rgba(255,255,255,0.7)", cursor: "pointer" }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      {isLoading ? (
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Loading keys…</p>
      ) : !keys?.length ? (
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>No API keys yet. Generate your first key above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{k.name}</span>
                  <code className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{k.key_prefix}</code>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={k.status === "active"
                      ? { color: "#5dcaa5", background: "rgba(93,202,165,0.1)", border: "0.5px solid rgba(93,202,165,0.25)" }
                      : { color: "#e24b4a", background: "rgba(226,75,74,0.1)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
                    {k.status}
                  </span>
                </div>
                <p className="text-[10px] m-0 mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {(k.scopes || []).join(" · ")} — {k.request_count} requests
                </p>
              </div>
              {k.status === "active" && (
                <button onClick={() => revokeMut.mutate(k.id)} aria-label="Revoke key" title="Revoke"
                  className="p-2 rounded-lg touch-target-compact"
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.30)", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}