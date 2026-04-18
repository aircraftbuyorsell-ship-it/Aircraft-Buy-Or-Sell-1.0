import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/dashboard/StatCard";
import ListingsByMakeChart from "@/components/dashboard/ListingsByMakeChart";
import ATIDistributionChart from "@/components/dashboard/ATIDistributionChart";
import ScraperRunsTable from "@/components/dashboard/ScraperRunsTable";
import { Plane, BarChart2, Zap, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list(),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-paid"],
    queryFn: () => base44.entities.Order.filter({ status: "paid" }),
  });

  const { data: scraperRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ["scraper-runs"],
    queryFn: () => base44.entities.ScraperRun.list("-created_date", 6),
  });

  const total_listings = listings.length;
  const avg_ati =
    listings.length > 0
      ? (listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length).toFixed(1)
      : "—";
  const hot_deals = deals.filter((d) => (d.deal_score || 0) >= 8.5).length;
  const total_revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

  const statsLoading = loadingListings || loadingDeals || loadingOrders;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Plane className="w-6 h-6 text-sky-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">ABOS Dashboard</h1>
        </div>
        <p className="text-slate-400 text-sm ml-9">Aircraft Buy or Sell — Platform Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Listings"
          value={total_listings}
          icon={<Plane className="w-5 h-5 text-sky-400" />}
          color="sky"
          loading={loadingListings}
        />
        <StatCard
          label="Avg ATI Score"
          value={avg_ati}
          icon={<BarChart2 className="w-5 h-5 text-violet-400" />}
          color="violet"
          loading={loadingListings}
          suffix="/ 100"
        />
        <StatCard
          label="Hot Deals"
          value={hot_deals}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          color="amber"
          loading={loadingDeals}
          sub="score ≥ 8.5"
        />
        <StatCard
          label="Revenue"
          value={`$${total_revenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          color="emerald"
          loading={loadingOrders}
          sub="paid orders"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <ListingsByMakeChart listings={listings} loading={loadingListings} />
        <ATIDistributionChart listings={listings} loading={loadingListings} />
      </div>

      {/* Scraper runs table */}
      <ScraperRunsTable runs={scraperRuns} loading={loadingRuns} />
    </div>
  );
}