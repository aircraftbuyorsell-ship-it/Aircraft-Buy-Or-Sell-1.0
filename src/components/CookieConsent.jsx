/**
 * CookieConsent.jsx — ABOS Marketspace GDPR Cookie Banner
 * DS v3 — ink-1 card, amber accent, no blur
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X, ChevronDown, ChevronUp, Check, Shield } from "lucide-react";

const C = {
  ink:  "#04060a", ink1: "#0d1117", ink2: "#111620",
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  w1: "rgba(255,255,255,0.90)", w2: "rgba(255,255,255,0.60)",
  w3: "rgba(255,255,255,0.35)", w5: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
};

const STORAGE_KEY = "abos_cookie_consent";

function readPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePrefs(prefs) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

export default function CookieConsent() {
  const [visible, setVisible]       = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [analytics, setAnalytics]   = useState(true);

  useEffect(() => {
    const prefs = readPrefs();
    if (!prefs) {
      setVisible(true);
    }
    window.ABOS_openCookieSettings = () => {
      const prefs = readPrefs();
      if (prefs) setAnalytics(prefs.analytics ?? true);
      setExpanded(true);
      setVisible(true);
    };
    return () => { delete window.ABOS_openCookieSettings; };
  }, []);

  function acceptAll() {
    savePrefs({ essential: true, analytics: true, timestamp: Date.now() });
    setVisible(false);
  }

  function acceptSelected() {
    savePrefs({ essential: true, analytics, timestamp: Date.now() });
    setVisible(false);
  }

  function declineAll() {
    savePrefs({ essential: true, analytics: false, timestamp: Date.now() });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position:    "fixed",
      bottom:      "20px",
      left:        "50%",
      transform:   "translateX(-50%)",
      width:       "min(680px, calc(100vw - 32px))",
      zIndex:      9999,
      fontFamily:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background:   C.ink1,
        border:       `0.5px solid ${C.amberBorder}`,
        borderRadius: "16px",
        overflow:     "hidden",
        boxShadow:    "0 8px 32px rgba(0,0,0,0.60), 0 0 0 0.5px rgba(245,194,66,0.08)",
      }}>
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${C.amber} 0%, rgba(245,194,66,0.30) 100%)` }} />

        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Cookie size={15} color={C.amber} />
              <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.02em", color: C.w1 }}>
                Cookie Preferences
              </span>
            </div>
            <button onClick={declineAll} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", color: C.w3, lineHeight: 0 }}>
              <X size={14} />
            </button>
          </div>

          <p style={{ fontSize: "12px", color: C.w2, lineHeight: 1.65, margin: "0 0 16px" }}>
            We use essential cookies to operate the platform and optional analytics cookies to improve it. No advertising cookies. Your data is handled per our{" "}
            <Link to="/privacy" style={{ color: C.amber, textDecoration: "none" }} onClick={() => setVisible(false)}>
              Privacy Policy
            </Link>
            .
          </p>

          <button
            onClick={() => setExpanded(e => !e)}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "transparent", border: "none", cursor: "pointer", color: C.w3, fontSize: "11px", fontWeight: 600, padding: 0, marginBottom: expanded ? "14px" : "0", letterSpacing: "0.04em" }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Hide details" : "Manage preferences"}
          </button>

          {expanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.w5, border: `0.5px solid ${C.border}`, borderRadius: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <Shield size={11} color={C.teal} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: C.w1 }}>Essential Cookies</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.tealDim, border: `0.5px solid ${C.tealBorder}`, color: C.teal, padding: "1px 7px", borderRadius: "9999px" }}>Always on</span>
                  </div>
                  <p style={{ fontSize: "11px", color: C.w3, margin: 0 }}>Session auth, CSRF protection, cookie preference storage</p>
                </div>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", background: C.tealDim, border: `1px solid ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={10} color={C.teal} strokeWidth={3} />
                </div>
              </div>

              <div
                onClick={() => setAnalytics(a => !a)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: analytics ? C.amberDim : C.w5, border: `0.5px solid ${analytics ? C.amberBorder : C.border}`, borderRadius: "8px", cursor: "pointer" }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: C.w1 }}>Analytics Cookies</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.amberDim, border: `0.5px solid ${C.amberBorder}`, color: C.amber, padding: "1px 7px", borderRadius: "9999px" }}>Optional</span>
                  </div>
                  <p style={{ fontSize: "11px", color: C.w3, margin: 0 }}>Aggregated usage statistics, feature adoption tracking</p>
                </div>
                <div style={{ width: "18px", height: "18px", borderRadius: "4px", background: analytics ? C.amberDim : "transparent", border: `1px solid ${analytics ? C.amber : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {analytics && <Check size={10} color={C.amber} strokeWidth={3} />}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: expanded ? "0" : "16px" }}>
            {expanded ? (
              <>
                <button onClick={acceptSelected} style={{ flex: 1, minWidth: "100px", padding: "9px 18px", background: C.amberDim, border: `0.5px solid ${C.amberBorder}`, borderRadius: "8px", color: C.amber, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Save selection
                </button>
                <button onClick={acceptAll} style={{ flex: 1, minWidth: "100px", padding: "9px 18px", background: C.amber, border: "none", borderRadius: "8px", color: C.ink, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Accept all
                </button>
              </>
            ) : (
              <>
                <button onClick={declineAll} style={{ padding: "9px 16px", background: "transparent", border: `0.5px solid ${C.border}`, borderRadius: "8px", color: C.w3, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  Essential only
                </button>
                <button onClick={acceptAll} style={{ flex: 1, padding: "9px 18px", background: C.amber, border: "none", borderRadius: "8px", color: C.ink, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Accept all cookies
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}