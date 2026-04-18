import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { User, ShieldCheck, CreditCard, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function roleBadge(role) {
  if (role === "admin") return "bg-violet-500/20 text-violet-400 border-violet-500/30";
  return "bg-slate-700 text-slate-400 border-slate-600";
}

function planBadge(plan) {
  if (plan === "pro") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-slate-700 text-slate-400 border-slate-600";
}

function orderStatusStyle(status) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (status === "pending") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (status === "failed") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-slate-700 text-slate-400 border-slate-600";
}

export default function MyAccount() {
  const queryClient = useQueryClient();
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: authUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["account-user", authUser?.email],
    enabled: !!authUser?.email,
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: authUser.email }, "-created_date", 1);
      if (users[0]) return users[0];
      return base44.entities.User.create({
        email: authUser.email,
        full_name: authUser.full_name || authUser.email,
        role: "user",
        plan: "free",
      });
    },
  });

  useEffect(() => {
    if (currentUser?.full_name) setNameInput(currentUser.full_name);
  }, [currentUser]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["account-orders", currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: () => base44.entities.Order.filter({ user: currentUser.id }, "-created_date", 50),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.User.update(currentUser.id, { full_name: nameInput }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const isLoading = loadingUser || !authUser;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">My Account</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile card */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">Profile</p>
          {isLoading ? (
            <div className="flex gap-4 items-center">
              <Skeleton className="w-16 h-16 rounded-full bg-slate-700" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-slate-700" />
                <Skeleton className="h-4 w-56 bg-slate-700" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                <span className="text-sky-400 font-black text-xl">{getInitials(currentUser?.full_name)}</span>
              </div>
              {/* Info */}
              <div className="flex-1">
                <p className="text-white font-bold text-lg">{currentUser?.full_name || "—"}</p>
                <p className="text-slate-400 text-sm">{currentUser?.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${roleBadge(currentUser?.role)}`}>
                    {currentUser?.role || "user"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${planBadge(currentUser?.plan)}`}>
                    {currentUser?.plan || "free"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit name */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Edit Profile</p>
          <div className="flex gap-3">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Full name"
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600"
            />
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !nameInput.trim()}
              className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors shrink-0"
            >
              {saved ? "Saved ✓" : saveMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Plan section */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Plan</p>
          {isLoading ? (
            <Skeleton className="h-10 w-48 bg-slate-700 rounded-lg" />
          ) : currentUser?.plan === "pro" ? (
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-base">Pro Active</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">PRO</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <p className="text-white font-semibold">Free Plan</p>
                <p className="text-slate-400 text-sm mt-0.5">Upgrade to Pro for unlimited ATI reports and priority access.</p>
              </div>
              <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors shrink-0">
                <CreditCard className="w-4 h-4" />
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Order History</p>
          {loadingOrders ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-slate-700 rounded" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-600">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700/60">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-right py-2 pr-4">Amount</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pr-4 text-slate-200 capitalize">{o.product_type?.replace("_", " ") || "—"}</td>
                      <td className="py-3 pr-4 text-right text-white font-medium">
                        {o.amount != null ? `$${o.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${orderStatusStyle(o.status)}`}>
                          {o.status || "—"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {o.created_date ? format(new Date(o.created_date), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}