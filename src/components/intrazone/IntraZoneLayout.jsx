import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Command, ArrowLeft } from "lucide-react";
import IntraZoneNavigation from "@/components/intrazone/IntraZoneNavigation";

export default function IntraZoneLayout() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("intrazone-tab") || "overview");
  useEffect(() => localStorage.setItem("intrazone-tab", activeTab), [activeTab]);
  const navigate = useNavigate();
  return <div className="min-h-screen bg-[#05060a] text-white">
    <IntraZoneNavigation activeTab={activeTab} onSelect={setActiveTab} />
    <main className="min-h-screen pb-24 lg:ml-64 lg:pb-8">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080a0f]/95 px-4 py-4 backdrop-blur md:px-7">
        <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} aria-label="Go back" className="flex items-center justify-center min-h-11 min-w-11 rounded-lg border border-white/10 bg-white/5 px-3 lg:hidden"><ArrowLeft className="h-5 w-5" /></button><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A017] text-[#05060a] lg:hidden"><Command className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4A017]">Deal origination & execution</p><h1 className="text-lg font-black">IntraZone</h1></div></div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-7"><Outlet context={{ activeTab, setActiveTab }} /></div>
    </main>
  </div>;
}