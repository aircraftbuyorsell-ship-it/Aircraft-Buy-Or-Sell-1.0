import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Captures ?ref=<email> from the URL once the user is authenticated and stores
// it on their User record as referred_by_email. One-time only; never overwrites.
// Mounted inside App.jsx (no UI).
export default function ReferralCapture() {
  const { data: user } = useQuery({
    queryKey: ["auth-me-ref"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => {
    if (!user) return;
    if (user.referred_by_email) return; // already captured

    // Check URL for ?ref=
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || localStorage.getItem("abos_ref");

    if (!ref) return;
    // Persist for later if user is not yet ready (safety); then clear
    localStorage.setItem("abos_ref", ref);

    const refEmail = ref.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(refEmail)) return;
    if (refEmail === (user.email || "").toLowerCase()) return; // no self-refer

    base44.auth.updateMe({ referred_by_email: refEmail })
      .then(() => localStorage.removeItem("abos_ref"))
      .catch(() => { /* silent */ });
  }, [user]);

  return null;
}