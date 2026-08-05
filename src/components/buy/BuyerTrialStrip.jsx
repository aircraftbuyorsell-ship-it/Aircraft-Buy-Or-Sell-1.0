import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function BuyerTrialStrip({ profile }) {
  const [loading, setLoading] = useState(false);
  if (!profile?.trial_expires_at || profile.buyer_pro_active) return null;
  const hours = Math.max(0, Math.ceil((new Date(profile.trial_expires_at).getTime() - Date.now()) / 3600000));
  const checkout = async (plan_type) => { setLoading(true); const response = await base44.functions.invoke("stripeCreateCheckout", { plan_type, returnUrl: `${window.location.origin}/buy?` }); window.location.assign(response.data.sessionUrl); };
  return <div className="border-b border-primary/30 bg-primary/10 px-4 py-2 text-center text-xs font-medium text-foreground">{hours > 0 ? <>Trial: {hours < 24 ? `${hours} hodin zbývá` : `${Math.ceil(hours / 24)} dny zbývají`}</> : <>Trial skončil — data zůstávají viditelná, akce jsou zamčené. <button type="button" disabled={loading} onClick={() => checkout("buyer_monthly")} className="ml-2 font-bold text-primary underline">$199/měs.</button><button type="button" disabled={loading} onClick={() => checkout("buyer_annual")} className="ml-2 font-bold text-primary underline">$999/rok</button></>}</div>;
}