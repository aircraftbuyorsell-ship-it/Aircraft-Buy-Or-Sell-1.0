import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ValuationResult {
  valuation_id: string;
  aircraft: string;
  estimated_value_usd: number;
  posterior_sigma_usd: number;
  valuation_mode: string;
  confidence: {
    within_10_pct: string;
    within_20_pct: string;
    within_30_pct: string;
    level: string;
  };
  market_evidence: {
    listings_used: number;
    n_eff: number;
    market_value_usd: number;
  };
}

interface OmvmValuationResultsProps {
  result: ValuationResult;
}

export default function OmvmValuationResults({ result }: OmvmValuationResultsProps) {
  const value = result.estimated_value_usd;
  const sigma = result.posterior_sigma_usd;
  const lower10 = value * 0.9;
  const upper10 = value * 1.1;
  const lower20 = value * 0.8;
  const upper20 = value * 1.2;

  const confidencePercent = parseInt(result.confidence.within_20_pct);
  const valuationModeLabels: Record<string, string> = {
    full_hedonic: 'Full Hedonic (n_eff ≥ 8)',
    reduced_hedonic: 'Reduced Hedonic (5 ≤ n_eff < 8)',
    robust_median: 'Robust Median (2 ≤ n_eff < 5)',
    fallback: 'Prior Only (n_eff < 2)',
  };

  const chartData = [
    {
      name: '±10%',
      value: value,
      lower: lower10,
      upper: upper10,
      probability: parseInt(result.confidence.within_10_pct),
    },
    {
      name: '±20%',
      value: value,
      lower: lower20,
      upper: upper20,
      probability: parseInt(result.confidence.within_20_pct),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">{result.aircraft}</h2>
        <p className="text-gray-600">OMVM 2.0 Valuation Report</p>
      </div>

      {/* Main Valuation Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg mb-8 border-2 border-blue-200">
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Estimated Value</p>
          <h3 className="text-5xl font-bold text-blue-900 mb-2">
            ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-gray-700">
            Standard Deviation: ±${sigma.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Confidence Bands */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded p-4">
            <p className="text-xs text-gray-600 mb-2">±10% Range</p>
            <p className="text-lg font-semibold mb-1">
              ${lower10.toLocaleString('en-US', { maximumFractionDigits: 0 })} -
              ${upper10.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-green-600 font-medium">{result.confidence.within_10_pct} confidence</p>
          </div>

          <div className="bg-white rounded p-4">
            <p className="text-xs text-gray-600 mb-2">±20% Range</p>
            <p className="text-lg font-semibold mb-1">
              ${lower20.toLocaleString('en-US', { maximumFractionDigits: 0 })} -
              ${upper20.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-green-600 font-medium">{result.confidence.within_20_pct} confidence</p>
          </div>

          <div className="bg-white rounded p-4">
            <p className="text-xs text-gray-600 mb-2">±30% Range</p>
            <p className="text-lg font-semibold mb-1">
              ${(value * 0.7).toLocaleString('en-US', { maximumFractionDigits: 0 })} -
              ${(value * 1.3).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-green-600 font-medium">{result.confidence.within_30_pct} confidence</p>
          </div>
        </div>
      </div>

      {/* Valuation Methodology */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Valuation Method
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Mode</p>
              <p className="font-medium">{valuationModeLabels[result.valuation_mode]}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence Level</p>
              <p className="font-medium capitalize">{result.confidence.level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">±20% Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="font-semibold">{confidencePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Evidence */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Market Evidence
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Listings Analyzed</p>
              <p className="font-medium">{result.market_evidence.listings_used}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Effective Sample Size (n_eff)</p>
              <p className="font-medium">{result.market_evidence.n_eff.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Market Value</p>
              <p className="font-medium">
                ${result.market_evidence.market_value_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Chart */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
        <h4 className="text-lg font-semibold mb-4">Confidence Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => (typeof value === 'number' ? `${value}%` : value)}
            />
            <Bar dataKey="probability" fill="#3b82f6" name="Confidence %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Valuation ID: {result.valuation_id}</p>
          <p className="text-sm text-blue-800">
            This valuation is based on Bayesian fusion of depreciation prior and market evidence.
            Valid for 30 days from creation.
          </p>
        </div>
      </div>
    </div>
  );
}
