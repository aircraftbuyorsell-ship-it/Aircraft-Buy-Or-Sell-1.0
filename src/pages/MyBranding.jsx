import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Palette, Sparkles, Upload, Lock, Check, RefreshCw } from "lucide-react";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

const FONTS = ["Inter", "Playfair Display", "Poppins", "Roboto", "Montserrat", "Lora", "Space Grotesk"];

const DEFAULTS = {
  brand_primary_color: "#D4A017",
  brand_accent_color: "#1A1814",
  brand_background_color: "#F7F4EF",
  brand_font: "Inter",
};

export default function MyBranding() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    company_name: "",
    brand_website: "",
    brand_logo_url: "",
    brand_primary_color: DEFAULTS.brand_primary_color,
    brand_accent_color: DEFAULTS.brand_accent_color,
    brand_background_color: DEFAULTS.brand_background_color,
    brand_font: DEFAULTS.brand_font,
    personalization_enabled: false,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
  });

  const isPremium = user?.plan === "pro" || user?.plan === "enterprise";

  useEffect(() => {
    if (user) {
      setForm({
        company_name: user.company_name || "",
        brand_website: user.brand_website || "",
        brand_logo_url: user.brand_logo_url || "",
        brand_primary_color: user.brand_primary_color || DEFAULTS.brand_primary_color,
        brand_accent_color: user.brand_accent_color || DEFAULTS.brand_accent_color,
        brand_background_color: user.brand_background_color || DEFAULTS.brand_background_color,
        brand_font: user.brand_font || DEFAULTS.brand_font,
        personalization_enabled: user.personalization_enabled || false,
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me-brand"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, brand_logo_url: file_url }));
    setUploading(false);
  };

  const resetToDefaults = () => {
    setForm(prev => ({ ...prev, ...DEFAULTS }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] p-8">
        <div className="h-10 w-64 bg-black/5 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <div className="flex items-center gap-2">
          <GoldLabel>Premium · Personalizace</GoldLabel>
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[rgba(212,160,23,0.12)] text-[#A67C00] border border-[rgba(212,160,23,0.3)]">
            PRO
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">My Branding</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Přizpůsobte dashboard barvám a stylu vaší značky</p>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-3xl space-y-4">
        {/* Premium gate */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-[#D4A017]/10 to-[#A67C00]/5 border border-[#D4A017]/30 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#D4A017]/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#A67C00]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-[#1A1814]">Premium funkce</p>
              <p className="text-[12px] text-[#6B6560] mt-1">
                Personalizované branding dashboardu je součástí plánu <strong>Pro</strong> a <strong>Enterprise</strong>.
                Upgradujte svůj účet a přizpůsobte vizuál ABOS barvám, fontu a logu vaší firmy.
              </p>
            </div>
          </div>
        )}

        {/* Enable toggle */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A1814]">Aktivovat personalizaci</p>
            <p className="text-[11px] text-[#6B6560] mt-0.5">Použít vlastní barvy a font napříč dashboardem</p>
          </div>
          <button
            disabled={!isPremium}
            onClick={() => setForm(prev => ({ ...prev, personalization_enabled: !prev.personalization_enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 ${form.personalization_enabled ? "bg-[#D4A017]" : "bg-black/15"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${form.personalization_enabled ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Company info */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Informace o firmě</GoldLabel>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Název firmy</label>
              <input
                type="text"
                disabled={!isPremium}
                value={form.company_name}
                onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="ABOS Aviation s.r.o."
                className="w-full px-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Webová stránka</label>
              <input
                type="url"
                disabled={!isPremium}
                value={form.brand_website}
                onChange={(e) => setForm(prev => ({ ...prev, brand_website: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Logo</GoldLabel>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-[#F7F4EF] border border-black/10 flex items-center justify-center overflow-hidden shrink-0">
              {form.brand_logo_url ? (
                <img src={form.brand_logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-6 h-6 text-[#AAA49C]" />
              )}
            </div>
            <div className="flex-1">
              <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${isPremium ? "border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-white" : "border-black/10 text-[#AAA49C] cursor-not-allowed"}`}>
                <Upload className="w-4 h-4" />
                {uploading ? "Nahrávám…" : "Nahrát logo"}
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={!isPremium || uploading} className="hidden" />
              </label>
              {form.brand_logo_url && (
                <button
                  onClick={() => setForm(prev => ({ ...prev, brand_logo_url: "" }))}
                  className="ml-2 text-[11px] text-[#C0392B] hover:underline"
                >
                  Odstranit
                </button>
              )}
              <p className="text-[11px] text-[#AAA49C] mt-1.5">PNG, JPG, SVG — doporučujeme 200×200 px nebo větší</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <GoldLabel>Barevná paleta</GoldLabel>
            <button
              onClick={resetToDefaults}
              disabled={!isPremium}
              className="flex items-center gap-1 text-[11px] text-[#AAA49C] hover:text-[#D4A017] disabled:opacity-40"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "brand_primary_color", label: "Primární (akcent)" },
              { key: "brand_accent_color", label: "Sekundární" },
              { key: "brand_background_color", label: "Pozadí" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={!isPremium}
                    value={form[key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-11 h-11 rounded-lg border border-black/10 cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    disabled={!isPremium}
                    value={form[key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-[12px] font-mono text-[#1A1814] focus:outline-none focus:border-[#D4A017] disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Font */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Typografie</GoldLabel>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FONTS.map((f) => {
              const active = form.brand_font === f;
              return (
                <button
                  key={f}
                  disabled={!isPremium}
                  onClick={() => setForm(prev => ({ ...prev, brand_font: f }))}
                  className={`px-4 py-3 rounded-xl border text-sm transition-all ${active ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#1A1814] font-bold" : "border-black/10 bg-white text-[#6B6560] hover:border-black/20"} disabled:opacity-50`}
                  style={{ fontFamily: `'${f}', system-ui, sans-serif` }}
                >
                  {f}
                  {active && <Check className="w-3 h-3 inline ml-1.5 text-[#D4A017]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <GoldLabel>Náhled</GoldLabel>
          </div>
          <div
            className="p-6 transition-colors"
            style={{ backgroundColor: form.brand_background_color, fontFamily: `'${form.brand_font}', system-ui` }}
          >
            <div className="flex items-center gap-3 mb-4">
              {form.brand_logo_url && (
                <img src={form.brand_logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border border-black/10" />
              )}
              <div>
                <p className="text-lg font-black" style={{ color: form.brand_accent_color }}>
                  {form.company_name || "Vaše firma"}
                </p>
                <p className="text-[11px]" style={{ color: form.brand_accent_color, opacity: 0.6 }}>Aircraft Dashboard</p>
              </div>
            </div>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: form.brand_primary_color }}
            >
              <Sparkles className="w-4 h-4 inline mr-1.5" />
              Primary Action
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isPremium || saveMutation.isPending}
            className="px-6 py-3 rounded-xl bg-[#1A1814] hover:bg-[#D4A017] disabled:opacity-40 text-white text-sm font-bold transition-colors"
          >
            {saved ? "Uloženo ✓" : saveMutation.isPending ? "Ukládám…" : "Uložit nastavení"}
          </button>
        </div>
      </div>
    </div>
  );
}