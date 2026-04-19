import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { User, ShieldCheck, CreditCard, Package, ChevronRight } from "lucide-react";
import { format } from "date-fns";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function StatusBadge({ status }) {
  const styles = {
    paid: "bg-[rgba(15,122,86,0.1)] text-[#0F7A56] border-[rgba(15,122,86,0.2)]",
    pending: "bg-[rgba(166,124,0,0.1)] text-[#A67C00] border-[rgba(166,124,0,0.2)]",
    failed: "bg-[rgba(192,57,43,0.1)] text-[#C0392B] border-[rgba(192,57,43,0.2)]"
  };
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${styles[status] || "bg-black/5 text-[#AAA49C] border-black/10"}`}>
      {status || "—"}
    </span>);

}

export default function MyAccount() {
  const queryClient = useQueryClient();
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: authUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me()
  });

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["account-user", authUser?.email],
    enabled: !!authUser?.email,
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: authUser.email }, "-created_date", 1);
      return users[0] || null;
    }
  });

  useEffect(() => {
    if (currentUser?.full_name) setNameInput(currentUser.full_name);
  }, [currentUser]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["account-orders", currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: () => base44.entities.Order.filter({ user: currentUser.id }, "-created_date", 50)
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ full_name: nameInput }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  });

  const isLoading = loadingUser || !authUser;

  return (
    <div className="bg-[#F7F4EF] opacity-95 min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>Account · Settings</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">My Account</h1>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4 max-w-2xl">
        {/* Profile */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Profile</GoldLabel>
          </div>
          <div className="px-5 py-5">
            {isLoading ?
            <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-black/5 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-black/5 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-black/5 rounded animate-pulse w-2/3" />
                </div>
              </div> :

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-14 h-14 rounded-full bg-[#D4A017]/10 border-2 border-[#D4A017]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#D4A017] font-black text-lg">{getInitials(authUser?.full_name)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-[#1A1814]">{authUser?.full_name || "—"}</p>
                  <p className="text-sm text-[#6B6560]">{authUser?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-[rgba(212,160,23,0.1)] text-[#A67C00] border-[rgba(212,160,23,0.2)] capitalize">
                      {currentUser?.role || "user"}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-black/5 text-[#AAA49C] border-black/10 capitalize">
                      {currentUser?.plan || "free"}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        {/* Edit name */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Edit Profile</GoldLabel>
          </div>
          <div className="px-5 py-5">
            <div className="flex gap-3">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Full name"
                className="flex-1 px-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors" />
              
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !nameInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#1A1814] hover:bg-[#D4A017] disabled:opacity-40 text-white text-sm font-bold transition-colors shrink-0">
                
                {saved ? "Saved ✓" : saveMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Subscription Plan</GoldLabel>
          </div>
          <div className="px-5 py-5">
            {isLoading ?
            <div className="h-10 bg-black/5 rounded animate-pulse" /> :
            currentUser?.plan === "pro" ?
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
                <div>
                  <p className="text-sm font-bold text-[#D4A017]">Pro Active</p>
                  <p className="text-[11px] text-[#6B6560]">Full access to all ABOS features</p>
                </div>
              </div> :

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1A1814]">Free Plan</p>
                  <p className="text-[12px] text-[#6B6560] mt-0.5">Upgrade for unlimited ATI reports and priority access</p>
                </div>
                <button className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
                  <CreditCard className="w-4 h-4" />
                  Upgrade to Pro
                </button>
              </div>
            }
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Order History</GoldLabel>
          </div>
          {loadingOrders ?
          <div className="px-5 py-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-black/5 rounded animate-pulse" />)}
            </div> :
          orders.length === 0 ?
          <div className="flex flex-col items-center py-10 text-[#AAA49C]">
              <Package className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div> :

          <div className="divide-y divide-black/[0.05]">
              {orders.map((o) =>
            <div key={o.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1814] capitalize">{o.product_type?.replace("_", " ") || "—"}</p>
                    <p className="text-[11px] text-[#AAA49C]">{o.created_date ? format(new Date(o.created_date), "MMM d, yyyy") : "—"}</p>
                  </div>
                  <p className="text-sm font-bold text-[#1A1814] shrink-0">{o.amount != null ? `$${o.amount.toLocaleString()}` : "—"}</p>
                  <StatusBadge status={o.status} />
                </div>
            )}
            </div>
          }
        </div>
      </div>
    </div>);

}