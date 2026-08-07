import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, XCircle } from "lucide-react";

const SCOPE_LABELS = {
  "search:read": "Search aircraft listings",
  "intelligence:read": "View ATI scores and market valuations",
  "listing:read": "View your listings",
  "listing:write": "Create and edit listings on your behalf",
};

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

function useQueryParams() {
  return new URLSearchParams(window.location.search);
}

export default function OAuthAuthorize() {
  const params = useQueryParams();
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const state = params.get("state") || "";
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method") || "S256";
  const scope = params.get("scope") || "search:read intelligence:read";

  const [status, setStatus] = useState("idle"); // idle | working | error
  const [error, setError] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["oauth-authorize-user"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: client, isLoading: clientLoading, isError: clientError } = useQuery({
    queryKey: ["oauth-client-info", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`/functions/abosOAuthClientInfo?client_id=${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error("invalid_client");
      return res.json();
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [userLoading, user]);

  const missingParams = !clientId || !redirectUri || !codeChallenge;

  async function handleAllow() {
    setStatus("working");
    setError("");
    try {
      const res = await base44.functions.invoke("abosOAuthIssueCode", {
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        scope: scope.split(/\s+/).filter(Boolean),
      });
      const { code } = res.data || {};
      if (!code) throw new Error("No code returned");
      const dest = new URL(redirectUri);
      dest.searchParams.set("code", code);
      if (state) dest.searchParams.set("state", state);
      window.location.href = dest.toString();
    } catch (e) {
      setStatus("error");
      setError(e?.response?.data?.error_description || e.message || "Could not complete authorization.");
    }
  }

  function handleDeny() {
    if (!redirectUri) return;
    const dest = new URL(redirectUri);
    dest.searchParams.set("error", "access_denied");
    if (state) dest.searchParams.set("state", state);
    window.location.href = dest.toString();
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#04060a" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#f5c242" }} />
      </div>
    );
  }

  if (missingParams || clientError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#04060a" }}>
        <div style={{ ...card, padding: 32, maxWidth: 420 }} className="text-center">
          <XCircle size={28} style={{ color: "#f87171", margin: "0 auto 12px" }} />
          <h1 className="text-[15px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.92)" }}>
            Invalid connection request
          </h1>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            This link is missing required information or refers to an app that isn't registered with ABOS.
          </p>
        </div>
      </div>
    );
  }

  const scopes = scope.split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#04060a" }}>
      <div style={{ ...card, padding: 32, maxWidth: 440, width: "100%" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <ShieldCheck size={18} style={{ color: "#f5c242" }} />
          <h1 className="text-[16px] font-bold m-0" style={{ color: "rgba(255,255,255,0.92)" }}>
            Connect to ABOS
          </h1>
        </div>

        <p className="text-[13px] mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
          {clientLoading ? "An application" : <strong>{client?.client_name || "An application"}</strong>} wants to
          access your ABOS account ({user.email}):
        </p>

        <div className="my-4 flex flex-col gap-2">
          {scopes.map((s) => (
            <div key={s} className="text-[13px] flex items-start gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <span style={{ color: "#f5c242" }}>•</span>
              {SCOPE_LABELS[s] || s}
            </div>
          ))}
        </div>

        {status === "error" && (
          <div className="text-[12px] mb-3" style={{ color: "#f87171" }}>{error}</div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={handleDeny}
            disabled={status === "working"}
            className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", cursor: "pointer" }}
          >
            Deny
          </button>
          <button
            onClick={handleAllow}
            disabled={status === "working"}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-60"
            style={{ background: "#f5c242", color: "#04060a", border: "none", cursor: "pointer" }}
          >
            {status === "working" ? <Loader2 size={14} className="animate-spin" /> : null}
            Allow
          </button>
        </div>

        <p className="text-[11px] mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
          You can revoke this connection any time from Core API → API Keys in your ABOS account.
        </p>
      </div>
    </div>
  );
}
