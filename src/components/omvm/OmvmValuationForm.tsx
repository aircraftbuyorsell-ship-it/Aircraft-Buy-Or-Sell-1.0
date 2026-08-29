import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const handleInputChange = (field: keyof AircraftData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      // Validate required fields
      if (!formData.registration || !formData.make || !formData.model || !formData.year) {
        throw new Error('Please fill in all required aircraft fields');
      }

      // Call the Base44 function
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

      // Reset form after 2 seconds
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">OMVM Aircraft Valuation</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Valuation created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aircraft Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Aircraft Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">N-Number *</label>
              <input
                type="text"
                value={formData.registration}
                onChange={e => handleInputChange('registration', e.target.value)}
                placeholder="N123AB"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Make *</label>
              <input
                type="text"
                value={formData.make}
                onChange={e => handleInputChange('make', e.target.value)}
                placeholder="Cessna"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => handleInputChange('model', e.target.value)}
                placeholder="172"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <input
                type="number"
                value={formData.year}
                onChange={e => handleInputChange('year', parseInt(e.target.value))}
                min="1940"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Engine Hours</label>
              <input
                type="number"
                value={formData.engine_hours}
                onChange={e => handleInputChange('engine_hours', parseFloat(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">TBO Remaining (%)</label>
              <input
                type="number"
                value={formData.tbo_remaining_pct}
                onChange={e => handleInputChange('tbo_remaining_pct', parseFloat(e.target.value))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Avionics */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Avionics Quality Score: {(formData.avionics_score * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.avionics_score}
              onChange={e => handleInputChange('avionics_score', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              0% = no avionics, 50% = moderate panel, 100% = glass cockpit
            </p>
          </div>
        </div>

        {/* Market Listings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Market Listings (Optional)</h3>

          {marketListings.length > 0 && (
            <div className="space-y-2">
              {marketListings.map((listing, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <span className="font-medium">{listing.source}</span>
                    {' - '}
                    <span>${listing.price_usd.toLocaleString()}</span>
                    {listing.hours && ` (${listing.hours}h)`}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMarketListing(idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select
                value={newListing.source}
                onChange={e => setNewListing(prev => ({ ...prev, source: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="controller">Controller</option>
                <option value="tap">Trade-A-Plane</option>
                <option value="barnstormers">Barnstormers</option>
                <option value="aso">ASO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                type="number"
                value={newListing.price_usd}
                onChange={e => setNewListing(prev => ({ ...prev, price_usd: parseFloat(e.target.value) }))}
                placeholder="50000"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addMarketListing}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
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
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Calculating Valuation...' : 'Get Valuation'}
        </button>
      </form>
    </div>
  );
}
