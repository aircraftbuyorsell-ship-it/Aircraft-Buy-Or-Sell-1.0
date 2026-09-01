import { useState } from 'react';
import { OmvmValuationForm, OmvmValuationResults } from '@/components/omvm';

interface ValuationResult {
  result: {
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
  };
}

export default function OmvmValuationPage() {
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = (apiResult: any) => {
    setResult(apiResult);
  };

  const handleError = (error: string) => {
    console.error('Valuation error:', error);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Aircraft Valuation</h1>
          <p className="text-gray-600 mt-2">
            Get an OMVM 2.0 valuation for any aircraft using Bayesian fusion of market data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {!result ? (
          <>
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">📊</div>
                <h3 className="font-semibold text-gray-900">Bayesian Fusion</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Combines depreciation model with market evidence
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-3xl font-bold text-green-600 mb-2">📈</div>
                <h3 className="font-semibold text-gray-900">Confidence Metrics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Probability within ±10%, ±20%, ±30% bands
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900">Market Evidence</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Weighted analysis of comparable listings
                </p>
              </div>
            </div>

            {/* Form */}
            <OmvmValuationForm
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </>
        ) : (
          <>
            {/* Results */}
            <OmvmValuationResults result={result.result} />

            {/* Actions */}
            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Get Another Valuation
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-600">
            OMVM 2.0 (Off-Market Value Model) uses APL/ADL protocols for audit compliance.
            Valuations are valid for 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}
