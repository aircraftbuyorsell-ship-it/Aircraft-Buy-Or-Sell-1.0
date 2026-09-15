import { Share2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import HubPageHeader from "@/components/hub/HubPageHeader";
import SocialPublisher from "@/components/marketing/SocialPublisher";
import FacebookGroupAssistant from "@/components/marketing/FacebookGroupAssistant";

export default function AdminMarketing() {
  const { user } = useAuth();
  const allowed = ["admin", "super_admin"].includes(user?.role);
  if (!allowed) return <div className="p-8"><div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 text-center"><h1 className="text-xl font-bold text-foreground">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Social publishing is available only to authorized marketing operators.</p></div></div>;
  return <div className="dark output-shell px-4 py-6 md:px-8 md:py-8"><div className="mx-auto max-w-6xl space-y-6"><HubPageHeader icon={Share2} eyebrow="Marketing Operations" title="Aircraft Social Publisher" subtitle="Turn live aircraft inventory, current market signals, and listing photography into synchronized Facebook and Instagram posts."/><SocialPublisher/><FacebookGroupAssistant/></div></div>;
}