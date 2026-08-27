import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { submitApiInquiry } from '@/lib/entitlements';
import {
  Terminal, Zap, Building2, Bot, ShieldCheck, ArrowRight, Loader2, Check,
  KeyRound, FileText, LockKeyhole, Sparkles, Mail, Download, Server,
} from 'lucide-react';

const AMBER = '#f5c242';
const TEAL = '#5dcaa5';
const BORDER = 'rgba(255,255,255,0.08)';

const PLANS = [
  {
    name: 'API Starter', price: '€690', period: '/month',
    tagline: 'Search & ATI Score for teams and product integrations.',
    features: ['ABOS Core API access', 'Search', 'ATI Score', 'Tenant-scoped API key', 'Usage monitoring', 'Production access'],
  },
  {
    name: 'API Professional', price: '€1,890', period: '/month', highlighted: true,
    tagline: 'Reporting, valuation and market intelligence.',
    features: ['Everything in Starter', 'ATI Report API', 'OMVM Valuation', 'Market Intelligence', 'Advanced intelligence endpoints', 'Expanded monthly usage'],
  },
  {
    name: 'Enterprise', price: 'from €3,900', period: '/month',
    tagline: 'Full capability set with contracted terms.',
    features: ['Everything in Professional', 'Aircraft Passport & registry lookup', 'Advanced intelligence', 'Custom integration', 'Dedicated onboarding', 'Contracted enterprise terms'],
  },
];

const WHITE_LABEL = {
  name: 'ABOS White-Label Integration License',
  price: '€2,500',
  tagline: 'One-time integration / license setup. Usage remains governed by the selected API plan.',
};

const VALUE_PROPS = [
  { icon: Zap, title: 'Aircraft intelligence', text: 'Search, ATI scoring, reports, valuation and market intelligence through one connected API layer.' },
  { icon: Building2, title: 'Built for platforms', text: 'Tenant-scoped access for aviation marketplaces, brokers, dealers and software products.' },
  { icon: Bot, title: 'Agent-ready', text: 'ABOS is designed for API and MCP workflows so your applications and AI agents can work from the same intelligence layer.' },
];

function PricingCard({ plan }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col relative" style={{
      background: plan.highlighted ? 'rgba(245,194,66,0.065)' : 'rgba(255,255,255,0.03)',
      border: plan.highlighted ? '1px solid rgba(245,194,66,0.38)' : `1px solid ${BORDER}`,
    }}>
      {plan.highlighted && <span className="absolute -top-3 left-6 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: AMBER, color: '#04060a' }}>Most popular</span>}
      <h3 className="text-[16px] font-bold mb-1" style={{ color: 'rgba(255,255,255,.94)' }}>{plan.name}</h3>
      <p className="text-[12px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,.52)' }}>{plan.tagline}</p>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-[29px] font-black" style={{ color: 'rgba(255,255,255,.96)' }}>{plan.price}</span>
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,.45)' }}>{plan.period}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,.70)' }}><Check size={13} className="mt-0.5 shrink-0" style={{ color: TEAL }} />{feature}</li>)}
      </ul>
    </div>
  );
}

export default function ApiLanding() {
  const { user, isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', use_case: '', volume: '', plan_interest: '', website: '' });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.full_name || user.name || '',
      email: current.email || user.email || '',
    }));
  }, [user]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitApiInquiry({ ...form, source: 'aircraftbuyorsell.com/api' });
      if (!result?.ok && !result?.request_received) throw new Error(result?.error || 'Request could not be submitted.');
      setSubmitted(true);
      window.setTimeout(() => document.getElementById('api-pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err) {
      setError(err?.message || 'Request could not be submitted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fileLabel = useMemo(() => submitted ? 'API Integration Package — available' : 'API Integration Package — request access', [submitted]);

  return (
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24" style={{ color: '#fff' }}>
      <div className="max-w-[1080px] mx-auto">
        <section className="mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5" style={{ background: 'rgba(245,194,66,.09)', border: '1px solid rgba(245,194,66,.22)' }}>
            <Terminal size={12} style={{ color: AMBER }} />
            <span className="text-[10px] font-bold tracking-[.16em] uppercase" style={{ color: AMBER }}>ABOS Core API · Integration</span>
          </div>
          <h1 className="tracking-[-.035em] leading-[1.02] mb-5" style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 500 }}>
            Aircraft intelligence.<br /><span style={{ color: AMBER, fontWeight: 750 }}>Built into your product.</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-[720px] mb-7" style={{ color: 'rgba(255,255,255,.62)' }}>
            ABOS Core API connects aircraft search, ATI scoring, due diligence, valuation and market intelligence to your application, marketplace, broker workflow or AI agent.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#request" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide" style={{ background: AMBER, color: '#04060a' }}>Request API pricing <ArrowRight size={14} /></a>
            <Link to="/partner-portal" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide" style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,.82)' }}><KeyRound size={13} /> Existing partner</Link>
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-4 mb-14">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${BORDER}` }}><div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(245,194,66,.09)' }}><Icon size={16} style={{ color: AMBER }} /></div><h3 className="text-[14px] font-bold mb-1.5">{title}</h3><p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>{text}</p></div>)}
        </section>

        <section className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 mb-16" id="request">
          <div className="rounded-3xl p-7 sm:p-9" style={{ background: 'linear-gradient(145deg, rgba(245,194,66,.09), rgba(255,255,255,.025))', border: '1px solid rgba(245,194,66,.22)' }}>
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} style={{ color: AMBER }} /><span className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: AMBER }}>Get API access</span></div>
            <h2 className="text-[25px] font-bold mb-3">Request pricing &amp; integration access</h2>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,.60)' }}>Tell us how you plan to use ABOS. If you are signed in, your account name and email are filled automatically. Submit the request and the API pricing becomes available immediately.</p>
            <form onSubmit={submit} className="space-y-3">
              <input aria-label="Website" tabIndex="-1" autoComplete="off" value={form.website} onChange={(e) => setField('website', e.target.value)} className="hidden" />
              <div className="grid sm:grid-cols-2 gap-3">
                <input required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Name" className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: 'rgba(0,0,0,.24)', border: `1px solid ${BORDER}`, color: '#fff' }} />
                <input required type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="Work email" className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: 'rgba(0,0,0,.24)', border: `1px solid ${BORDER}`, color: '#fff' }} />
              </div>
              <input value={form.company} onChange={(e) => setField('company', e.target.value)} placeholder="Company / platform" className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: 'rgba(0,0,0,.24)', border: `1px solid ${BORDER}`, color: '#fff' }} />
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={form.use_case} onChange={(e) => setField('use_case', e.target.value)} className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: '#11151a', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,.82)' }}><option value="">Primary use case</option><option>Marketplace</option><option>Broker / dealer</option><option>Aircraft data product</option><option>AI agent / MCP</option><option>Internal aviation workflow</option><option>Other</option></select>
                <select value={form.volume} onChange={(e) => setField('volume', e.target.value)} className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: '#11151a', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,.82)' }}><option value="">Expected monthly volume</option><option>Under 100</option><option>100–1,000</option><option>1,000–10,000</option><option>10,000+</option><option>Custom / unknown</option></select>
              </div>
              <select value={form.plan_interest} onChange={(e) => setField('plan_interest', e.target.value)} className="w-full rounded-xl px-4 py-3 text-[13px] outline-none" style={{ background: '#11151a', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,.82)' }}><option value="">Plan of interest</option><option>API Starter — €690/month</option><option>API Professional — €1,890/month</option><option>Enterprise — from €3,900/month</option><option>White-Label — €2,500 one-time + API plan</option><option>Not sure — recommend a plan</option></select>
              {error && <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background: 'rgba(226,75,74,.08)', border: '1px solid rgba(226,75,74,.25)', color: '#f0a3a2' }}>{error}</div>}
              <button disabled={loading} className="w-full py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: AMBER, color: '#04060a' }}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{loading ? 'Submitting…' : submitted ? 'Request submitted' : 'Submit request & reveal pricing'}</button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,194,66,.09)' }}><FileText size={18} style={{ color: AMBER }} /></div><div><div className="text-[14px] font-bold">{fileLabel}</div><div className="text-[11px]" style={{ color: 'rgba(255,255,255,.42)' }}>PDF · OpenAPI · Integration Kit</div></div></div>
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,0,0,.20)', border: `1px solid ${BORDER}` }}><div className="text-[10px] uppercase tracking-[.14em] mb-2" style={{ color: AMBER }}>What is included</div><div className="grid grid-cols-2 gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,.66)' }}><span>• API overview</span><span>• Endpoint map</span><span>• Authentication</span><span>• Usage model</span><span>• Pricing</span><span>• Integration path</span></div></div>
              {!submitted && <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,.42)' }}><LockKeyhole size={13} /> File package is unlocked after the request is submitted.</div>}
              {submitted && <div className="flex items-center gap-2 text-[11px]" style={{ color: TEAL }}><Download size={13} /> Pricing and integration package is now available below.</div>}
            </div>
            <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,.025)', border: `1px solid ${BORDER}` }}><div className="flex items-center gap-2 mb-3"><Server size={15} style={{ color: TEAL }} /><h3 className="text-[14px] font-bold">One integration layer</h3></div><p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,.54)' }}>Your application uses one tenant-scoped API identity. ABOS enforces capability access server-side, so the browser never decides what an account is entitled to use.</p></div>
          </div>
        </section>

        {submitted && <section id="api-pricing" className="scroll-mt-8 mb-16">
          <div className="flex items-end justify-between gap-4 mb-6"><div><div className="flex items-center gap-2 mb-2"><ShieldCheck size={15} style={{ color: TEAL }} /><span className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: TEAL }}>Pricing unlocked</span></div><h2 className="text-[26px] font-bold">API plans</h2><p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.48)' }}>Transparent list pricing. Enterprise usage and contractual terms are finalized after the integration review.</p></div></div>
          <div className="grid md:grid-cols-3 gap-4">{PLANS.map((plan) => <PricingCard key={plan.name} plan={plan} />)}</div>
          <div className="mt-4 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: 'rgba(245,194,66,.06)', border: '1px solid rgba(245,194,66,.18)' }}><div><h3 className="text-[14px] font-bold">{WHITE_LABEL.name}</h3><p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,.50)' }}>{WHITE_LABEL.tagline}</p></div><div className="text-[22px] font-black" style={{ color: AMBER }}>{WHITE_LABEL.price}</div></div>
          <div className="mt-5 text-[11px]" style={{ color: 'rgba(255,255,255,.42)' }}>White-label is a license/setup fee, not unlimited usage. API usage is governed by the selected Starter, Professional or Enterprise plan.</div>
        </section>}

        <section className="rounded-2xl p-5 text-[11px] leading-relaxed" style={{ background: 'rgba(255,255,255,.025)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,.45)' }}>
          <strong style={{ color: 'rgba(255,255,255,.68)' }}>Access model:</strong> API capabilities are tenant-scoped and enforced server-side. Exact usage allowances, overage terms, SLA and custom data requirements may vary by contract. The API catalog above is the current public starting price, not a promise of unlimited calls.
        </section>
      </div>
    </div>
  );
}
