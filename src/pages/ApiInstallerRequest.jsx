import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, CreditCard, Download, Loader2, LockKeyhole, Send, ShieldCheck, Sparkles } from 'lucide-react';

const SKYDEALS_EMAIL = 'skydealseurope@gmail.com';
const SKYDEALS_PLAN_TYPE = 'skydeals_custom_quarterly';
const SKYDEALS_REQUEST_KEY = 'abos_skydeals_installer_request';

const ALLOWED_EMAILS = ['adam@aircraftbuyorsell.com', '12byteflow@gmail.com'];
const INSTANT_PRICING = [
  { key: 'API_STARTER', name: 'ABOS API — Starter', price_eur: 690, billing: 'per month' },
  { key: 'API_PROFESSIONAL', name: 'ABOS API — Professional', price_eur: 1890, billing: 'per month' },
  { key: 'API_ENTERPRISE', name: 'ABOS API — Enterprise', price_eur: 3900, billing: 'per month / contract' },
  { key: 'WHITE_LABEL_LICENSE', name: 'ABOS White-Label Integration License', price_eur: 2500, billing: 'one-time' },
];

const POSITIONS = ['Founder','CEO','CTO','CSO','COO','Developer','Engineering','Product','Marketing','Other'];
const CHANNELS = ['Facebook','Google','Instagram','LinkedIn','YouTube','Email','Direct / Organic','Other'];
const AUDIENCES = ['Aircraft buyers','Aircraft sellers','Brokers / dealers','Owners','Operators','Maintenance / service','Lenders / finance','Other'];
const PRICING = [
  ['ABOS API — Starter','€690','/ month'],
  ['ABOS API — Professional','€1,890','/ month'],
  ['ABOS API — Enterprise','€3,900','/ month / contract'],
  ['ABOS White-Label Integration License','€2,500','one-time'],
];

const inputClass = 'w-full rounded-xl px-4 py-3 text-[13px] outline-none';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'white' };

export default function ApiInstallerRequest() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const { data: user } = useQuery({ queryKey: ['auth-me-installer'], queryFn: () => base44.auth.me().catch(() => null), retry: false, staleTime: 60000 });
  const userEmail = (user?.email || '').trim().toLowerCase();
  const isPreApproved = ALLOWED_EMAILS.includes(userEmail);

  useEffect(() => {
    if (isPreApproved && !submitted) {
      setSubmitted({ submitted_email: user?.email, recommended_plan: 'ABOS White-Label Integration License', pricing: INSTANT_PRICING, pre_approved: true });
    }
  }, [isPreApproved, submitted, user]);

  const [form, setForm] = useState({
    full_name: '', email: '', company_name: '', company_url: '', position: '',
    aircraft_registration: params.get('registration') || params.get('tail') || '',
    monthly_listing_views: '', monthly_unique_visitors: '', marketing_channels: [], target_audience: [],
    use_case: '', requested_plan: '', privacy_acknowledged: false,
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [trialApproved, setTrialApproved] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggle = (key, value) => setForm(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value] }));

  useEffect(() => {
    const cached = sessionStorage.getItem(SKYDEALS_REQUEST_KEY);
    if (cached && userEmail === SKYDEALS_EMAIL && !submitted) setSubmitted(JSON.parse(cached));
  }, [submitted, userEmail]);

  useEffect(() => {
    const sessionId = params.get('stripe_session');
    if (!sessionId || params.get('success') !== 'true' || userEmail !== SKYDEALS_EMAIL) return;
    base44.functions.invoke('stripeCheckoutStatus', { session_id: sessionId }).then(res => {
      if (res?.data?.status === 'complete' && res?.data?.custom_offer === SKYDEALS_PLAN_TYPE) {
        setTrialApproved(true);
        sessionStorage.removeItem(SKYDEALS_REQUEST_KEY);
      }
    }).catch(err => setError(err?.message || 'Could not confirm trial approval.'));
  }, [params, userEmail]);

  const startSkyDealsTrial = async () => {
    if (userEmail !== SKYDEALS_EMAIL) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setCheckoutLoading(true); setError('');
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?tab=installer`;
      const res = await base44.functions.invoke('stripeCreateCheckout', { plan_type: SKYDEALS_PLAN_TYPE, inquiry_id: submitted.inquiry_id, returnUrl });
      if (!res?.data?.sessionUrl) throw new Error(res?.data?.error || 'Could not start the trial.');
      window.location.href = res.data.sessionUrl;
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not start the trial.');
      setCheckoutLoading(false);
    }
  };

  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.privacy_acknowledged) return setError('Please acknowledge the limited-use data policy.');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('submitApiInquiry', { ...form, created_at_client: new Date().toISOString() });
      if (!res?.data?.pricing_unlocked) throw new Error(res?.data?.error || 'Request could not be processed.');
      setSubmitted(res.data);
      if (res.data.skydeals_offer) sessionStorage.setItem(SKYDEALS_REQUEST_KEY, JSON.stringify(res.data));
    } catch (err) { setError(err?.message || 'Request could not be processed.'); }
    finally { setLoading(false); }
  };

  return <div className="min-h-screen text-white px-4 sm:px-8 py-10">
    <div className="max-w-[980px] mx-auto">
      <div className="rounded-[28px] p-7 sm:p-10 mb-6" style={{ background: 'linear-gradient(135deg,rgba(245,194,66,.10),rgba(255,255,255,.025) 48%,rgba(93,202,165,.05))', border: '1px solid rgba(255,255,255,.09)' }}>
        <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-[.16em]" style={{ color:'#f5c242' }}><ShieldCheck size={14}/> ABOS Self-Hosted Integration</div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Get the Installer Pack.</h1>
        <p className="max-w-2xl text-sm leading-relaxed" style={{ color:'rgba(255,255,255,.62)' }}>Tell us what you are building and we will unlock the current API pricing and the ABOS self-hosted integration package. The information below is used only to prepare a personalized offer.</p>
      </div>

      {!submitted ? <form onSubmit={submit} className="rounded-3xl p-6 sm:p-8" style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.09)' }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <input className={inputClass} style={inputStyle} required placeholder="Full name *" value={form.full_name} onChange={e=>set('full_name',e.target.value)} />
          <input className={inputClass} style={inputStyle} required type="email" placeholder="Business email *" value={form.email} onChange={e=>set('email',e.target.value)} />
          <input className={inputClass} style={inputStyle} required placeholder="Company name *" value={form.company_name} onChange={e=>set('company_name',e.target.value)} />
          <input className={inputClass} style={inputStyle} required type="url" placeholder="Company website URL *" value={form.company_url} onChange={e=>set('company_url',e.target.value)} />
          <select className={inputClass} style={inputStyle} required value={form.position} onChange={e=>set('position',e.target.value)}><option value="">Position *</option>{POSITIONS.map(x=><option key={x}>{x}</option>)}</select>
          <input className={inputClass} style={inputStyle} placeholder="Aircraft registration / tail (optional)" value={form.aircraft_registration} onChange={e=>set('aircraft_registration',e.target.value.toUpperCase())} />
          <select className={inputClass} style={inputStyle} value={form.monthly_listing_views} onChange={e=>set('monthly_listing_views',e.target.value)}><option value="">Monthly listing views</option><option>Under 1,000</option><option>1,000–10,000</option><option>10,000–100,000</option><option>100,000–500,000</option><option>500,000+</option></select>
          <select className={inputClass} style={inputStyle} value={form.monthly_unique_visitors} onChange={e=>set('monthly_unique_visitors',e.target.value)}><option value="">Monthly unique visitors</option><option>Under 1,000</option><option>1,000–10,000</option><option>10,000–100,000</option><option>100,000+</option></select>
        </div>

        <div className="mt-6"><div className="text-xs font-bold mb-2">Main marketing channels</div><div className="flex flex-wrap gap-2">{CHANNELS.map(x=><button type="button" key={x} onClick={()=>toggle('marketing_channels',x)} className="px-3 py-2 rounded-lg text-[11px]" style={{ background:form.marketing_channels.includes(x)?'rgba(245,194,66,.16)':'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', color:form.marketing_channels.includes(x)?'#f5c242':'rgba(255,255,255,.65)' }}>{x}</button>)}</div></div>
        <div className="mt-5"><div className="text-xs font-bold mb-2">Main target audience</div><div className="flex flex-wrap gap-2">{AUDIENCES.map(x=><button type="button" key={x} onClick={()=>toggle('target_audience',x)} className="px-3 py-2 rounded-lg text-[11px]" style={{ background:form.target_audience.includes(x)?'rgba(93,202,165,.14)':'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', color:form.target_audience.includes(x)?'#5dcaa5':'rgba(255,255,255,.65)' }}>{x}</button>)}</div></div>

        <textarea className={`${inputClass} mt-5 resize-none`} style={inputStyle} rows={4} placeholder="What are you building / what should the ABOS integration do?" value={form.use_case} onChange={e=>set('use_case',e.target.value)} />
        <select className={`${inputClass} mt-4`} style={inputStyle} value={form.requested_plan} onChange={e=>set('requested_plan',e.target.value)}><option value="">Preferred package (optional)</option>{PRICING.map(x=><option key={x[0]}>{x[0]}</option>)}</select>

        <label className="mt-5 flex items-start gap-3 text-[11px] leading-relaxed" style={{color:'rgba(255,255,255,.58)'}}><input type="checkbox" checked={form.privacy_acknowledged} onChange={e=>set('privacy_acknowledged',e.target.checked)} className="mt-0.5" /><span>I understand that these business details are collected only to prepare a personalized ABOS offer. ABOS will not sell or share them with third parties or use them for unrelated purposes.</span></label>
        {error && <div className="mt-4 text-xs" style={{color:'#f0a3a2'}}>{error}</div>}
        <button disabled={loading} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50" style={{background:'#f5c242',color:'#04060a'}}>{loading?<Send size={14} className="animate-pulse"/>:<Send size={14}/>} Submit & unlock pricing</button>
      </form> : <div className="rounded-3xl p-6 sm:p-8" style={{background:'rgba(93,202,165,.05)',border:'1px solid rgba(93,202,165,.22)'}}>
        <div className="flex items-center gap-2 text-sm font-bold mb-2" style={{color:'#5dcaa5'}}><CheckCircle2 size={18}/> {submitted.pre_approved ? 'Installer Pack ready' : 'Request received'}</div>
        {submitted.pre_approved
          ? <p className="text-sm" style={{color:'rgba(255,255,255,.62)'}}>Your account <strong style={{color:'white'}}>{submitted.submitted_email}</strong> is pre-approved — the Installer Pack and current API pricing are unlocked for you right away, no request form needed.</p>
          : <p className="text-sm" style={{color:'rgba(255,255,255,.62)'}}>Pricing is unlocked for <strong style={{color:'white'}}>{submitted.submitted_email}</strong>. Recommended package: <strong style={{color:'#f5c242'}}>{submitted.recommended_plan}</strong>.</p>}
        {submitted.skydeals_offer ? <div className="mt-6 rounded-2xl p-5" style={{background:'rgba(245,194,66,.07)',border:'1px solid rgba(245,194,66,.28)'}}><div className="text-xs font-bold">SkyDeals Europe White-Label Custom</div><div className="text-2xl font-black mt-2">€1,500 <span className="text-xs font-medium" style={{color:'rgba(255,255,255,.55)'}}>every 3 months</span></div><p className="mt-2 text-xs" style={{color:'rgba(255,255,255,.6)'}}>30 days free. A card is required before the trial starts; the first automatic charge occurs after the trial unless canceled.</p></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">{(submitted.pricing || []).map(p=><div key={p.key} className="rounded-2xl p-4" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}><div className="text-xs font-bold">{p.name}</div><div className="text-2xl font-black mt-2">€{Number(p.price_eur).toLocaleString('en-US')}</div><div className="text-[10px] mt-1" style={{color:'rgba(255,255,255,.45)'}}>{p.billing}</div></div>)}</div>}
        {submitted.pre_approved && <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{color:'#f5c242'}}><Sparkles size={13}/> Pre-approved access</div>}
        {submitted.skydeals_offer && !trialApproved ? <button type="button" onClick={startSkyDealsTrial} disabled={checkoutLoading} className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase disabled:opacity-50" style={{background:'#f5c242',color:'#04060a'}}>{checkoutLoading ? <Loader2 size={14} className="animate-spin"/> : <CreditCard size={14}/>} Confirm email, add card & start free trial</button> : <a href="/ABOS-API-Integration-Kit.json" download className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase" style={{background:'#f5c242',color:'#04060a'}}><Download size={14}/> Download Installer / Integration Kit</a>}
        <div className="mt-5 flex items-start gap-2 text-[11px]" style={{color:'rgba(255,255,255,.46)'}}><LockKeyhole size={13}/> Your submitted business information remains restricted to the personalized-offer workflow.</div>
      </div>}
    </div>
  </div>;
}