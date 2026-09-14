import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";

export default function AiDealPaywall() {
  return <section className="ai-deal-card ai-deal-paywall" role="status"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary"/><h3>ABOS Pro Required</h3></div><p className="mt-2">AI Deal Analyst is available with an active paid ABOS plan.</p><Link to="/plans" className="mt-3 inline-block">View Paid Plans →</Link></section>;
}