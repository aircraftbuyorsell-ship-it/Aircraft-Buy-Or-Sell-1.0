import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Search, X } from 'lucide-react';

// Aircraft models database with categories
const GA_AIRCRAFT = [
  { label: "Cessna 152", make: "Cessna", model: "152", category: "Single-Engine Piston" },
  { label: "Cessna 172 Skyhawk", make: "Cessna", model: "172", category: "Single-Engine Piston" },
  { label: "Cessna 182 Skylane", make: "Cessna", model: "182", category: "Single-Engine Piston" },
  { label: "Cessna 206 Stationair", make: "Cessna", model: "206", category: "Single-Engine Piston" },
  { label: "Cessna 210 Centurion", make: "Cessna", model: "210", category: "Single-Engine Piston" },
  { label: "Piper PA-28 Warrior", make: "Piper", model: "PA-28", category: "Single-Engine Piston" },
  { label: "Piper PA-28 Archer", make: "Piper", model: "PA-28", category: "Single-Engine Piston" },
  { label: "Piper PA-32 Saratoga", make: "Piper", model: "PA-32", category: "Single-Engine Piston" },
  { label: "Cirrus SR20", make: "Cirrus", model: "SR20", category: "Single-Engine Piston" },
  { label: "Cirrus SR22", make: "Cirrus", model: "SR22", category: "Single-Engine Piston" },
  { label: "Beechcraft Bonanza A36", make: "Beechcraft", model: "A36", category: "Single-Engine Piston" },
  { label: "Diamond DA40", make: "Diamond", model: "DA40", category: "Single-Engine Piston" },
  { label: "Piper PA-34 Seneca", make: "Piper", model: "PA-34", category: "Multi-Engine Piston" },
  { label: "Beechcraft Baron 58", make: "Beechcraft", model: "58", category: "Multi-Engine Piston" },
  { label: "Beechcraft King Air 350", make: "Beechcraft", model: "350", category: "Turboprop" },
];

interface AircraftData {
  registration: string;
  make: string;
  model: string;
  year: number;
  engine_hours: number;
  tbo_remaining_pct: number;
  avionics_score: number;
  aircraft_listing_id?: string;
}

interface MarketListing {
  source: 'controller' | 'tap' | 'barnstormers' | 'aso';
  price_usd: number;
  observed_at: string;
  hours?: number;
}

interface OmvmValuationFormProps {
  aircraft?: Partial<AircraftData>;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function OmvmValuationForm({
  aircraft = {},
  onSuccess,
  onError,
}: OmvmValuationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState<AircraftData>({
    registration: aircraft.registration || '',
    make: aircraft.make || '',
    model: aircraft.model || '',
    year: aircraft.year || new Date().getFullYear(),
    engine_hours: aircraft.engine_hours || 0,
    tbo_remaining_pct: aircraft.tbo_remaining_pct || 50,
    avionics_score: aircraft.avionics_score || 0.5,
  });

  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [newListing, setNewListing] = useState({
    source: 'controller' as const,
    price_usd: 0,
    hours: 0,
  });

  // Filter aircraft suggestions based on search input
  const filteredAircraft = useMemo(() => {
    if (!searchInput.trim()) return [];
    const query = searchInput.toLowerCase();
    return GA_AIRCRAFT.filter(a =>
      a.label.toLowerCase().includes(query) ||
      a.make.toLowerCase().includes(query) ||
      a.model.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchInput]);

  const handleInputChange = (field: keyof AircraftData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAircraftSelect = (selected: typeof GA_AIRCRAFT[0]) => {
    setFormData(prev => ({
      ...prev,
      make: selected.make,
      model: selected.model,
    }));
    setSearchInput('');
    setShowSuggestions(false);
  };

  const addMarketListing = () => {
    if (!newListing.price_usd) {
      setError('Price is required for market listing');
      return;
    }

    setMarketListings(prev => [
      ...prev,
      {
        ...newListing,
        observed_at: new Date().toISOString(),
      },
    ]);
    setNewListing({ source: 'controller', price_usd: 0, hours: 0 });
  };

  const removeMarketListing = (index: number) => {
    setMarketListings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!formData.registration || !formData.make || !formData.model || !formData.year) {
        throw new Error('Please fill in all required aircraft fields');
      }

      const response = await fetch('/functions/invokeOmvmValuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: {
            ...formData,
            market_listings: marketListings,
            aircraft_listing_id: aircraft.aircraft_listing_id,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Valuation failed');
      }

      const result = await response.json();
      setSuccess(true);
      onSuccess?.(result);

      setTimeout(() => {
        setFormData({
          registration: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          engine_hours: 0,
          tbo_remaining_pct: 50,
          avionics_score: 0.5,
        });
        setMarketListings([]);
        setSearchInput('');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4EF] to-[#EBE5DE]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1A1814] mb-2">OMVM Valuation</h1>
          <p className="text-[#6B6560]">Bayesian fusion of aircraft depreciation and market data</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Valuation created successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Aircraft Search Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D4A017]/20 p-8">
            <label className="block text-xs font-bold text-[#D4A017] uppercase tracking-wider mb-4">
              Aircraft Lookup
            </label>
            <h2 className="text-2xl font-bold text-[#1A1814] mb-6">Find Your Aircraft</h2>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-5 h-5 text-[#AAA49C]" />
              <input
                type="text"
                value={searchInput}
                onChange={e => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by make or model (e.g., Cessna 172, Piper PA-28)..."
                className="w-full pl-10 pr-4 py-3 border-2 border-[#D4A017]/30 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814] placeholder:text-[#AAA49C]"
              />

              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredAircraft.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border-2 border-[#D4A017]/30 rounded-lg shadow-lg z-10">
                  {filteredAircraft.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAircraftSelect(option)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F4EF] border-b border-[#D4A017]/10 last:border-0 transition"
                    >
                      <div className="font-semibold text-[#1A1814]">{option.label}</div>
                      <div className="text-xs text-[#AAA49C] mt-1">{option.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Aircraft Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1814] uppercase tracking-wider">Aircraft Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1814] mb-2">N-Number *</label>
                  <input
                    type="text"
                    value={formData.registration}
                    onChange={e => handleInputChange('registration', e.target.value)}
                    placeholder="N123AB"
                    className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1814] mb-2">Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={e => handleInputChange('make', e.target.value)}
                    placeholder="Cessna"
                    className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1814] mb-2">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => handleInputChange('model', e.target.value)}
                    placeholder="172"
                    className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1814] mb-2">Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => handleInputChange('year', parseInt(e.target.value))}
                    min="1940"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Condition Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D4A017]/20 p-8">
            <label className="block text-xs font-bold text-[#D4A017] uppercase tracking-wider mb-4">
              Aircraft Condition
            </label>
            <h2 className="text-2xl font-bold text-[#1A1814] mb-6">Specify Condition</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1814] mb-2">Engine Hours</label>
                <input
                  type="number"
                  value={formData.engine_hours}
                  onChange={e => handleInputChange('engine_hours', parseFloat(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1814] mb-2">TBO Remaining (%)</label>
                <input
                  type="number"
                  value={formData.tbo_remaining_pct}
                  onChange={e => handleInputChange('tbo_remaining_pct', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814]"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[#1A1814] mb-4">
                Avionics Quality Score: <span className="font-bold text-[#D4A017]">{(formData.avionics_score * 100).toFixed(0)}%</span>
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.avionics_score}
                  onChange={e => handleInputChange('avionics_score', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#D4A017]/20 rounded-full appearance-none cursor-pointer accent-[#D4A017]"
                />
                <div className="flex justify-between text-xs text-[#6B6560]">
                  <span>No avionics</span>
                  <span>Moderate panel</span>
                  <span>Glass cockpit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Listings Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D4A017]/20 p-8">
            <label className="block text-xs font-bold text-[#D4A017] uppercase tracking-wider mb-4">
              Market Data (Optional)
            </label>
            <h2 className="text-2xl font-bold text-[#1A1814] mb-6">Add Comparable Listings</h2>

            {marketListings.length > 0 && (
              <div className="mb-6 space-y-2">
                {marketListings.map((listing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gradient-to-r from-[#F7F4EF] to-white p-4 rounded-lg border border-[#D4A017]/10"
                  >
                    <div className="text-sm">
                      <span className="font-semibold text-[#1A1814]">{listing.source}</span>
                      <span className="text-[#6B6560]"> • </span>
                      <span className="text-[#D4A017] font-bold">${listing.price_usd.toLocaleString()}</span>
                      {listing.hours && <span className="text-[#6B6560]"> • {listing.hours}h</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMarketListing(idx)}
                      className="text-[#AAA49C] hover:text-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1814] mb-2">Source</label>
                <select
                  value={newListing.source}
                  onChange={e => setNewListing(prev => ({ ...prev, source: e.target.value as any }))}
                  className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814] text-sm"
                >
                  <option value="controller">Controller</option>
                  <option value="tap">Trade-A-Plane</option>
                  <option value="barnstormers">Barnstormers</option>
                  <option value="aso">ASO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1814] mb-2">Price ($)</label>
                <input
                  type="number"
                  value={newListing.price_usd}
                  onChange={e => setNewListing(prev => ({ ...prev, price_usd: parseFloat(e.target.value) }))}
                  placeholder="50000"
                  className="w-full px-4 py-2.5 border-2 border-[#D4A017]/20 rounded-lg focus:outline-none focus:border-[#D4A017] transition bg-white text-[#1A1814] text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addMarketListing}
                  className="w-full px-4 py-2.5 bg-[#D4A017] text-white rounded-lg font-semibold hover:bg-[#A67C00] transition"
                >
                  Add Listing
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#D4A017] to-[#A67C00] text-white rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Calculating Valuation...' : 'Get OMVM Valuation'}
          </button>
        </form>
      </div>
    </div>
  );
}
