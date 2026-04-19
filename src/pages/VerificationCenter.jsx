import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, Shield, CreditCard, CheckCircle2, Loader2, ArrowRight, Sparkles, Zap } from "lucide-react";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import { toCredits } from "@/lib/pricing";

const STEPS = [
  { id: "email", label: "Email", icon: Mail, desc: "Confirm your inbox" },
  { id: "phone", label: "Phone", icon: Phone, desc: "6-digit SMS code" },
  { id: "2fa", label: "2FA", icon: Shield, desc: "Authenticator or passkey" },
  { id: "pay", label: "Payment", icon: CreditCard, desc: "$8 · 20 ATI credits" },
];

function StepDot({ index, current, done }) {
  const isDone = done || index < current;
  const isActive = index === current;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
        isDone ? "bg-[#0F7A56] text-white" :
        isActive ? "bg-[#D4A017] text-white ring-4 ring-[#D4A017]/20" :
        "bg-white border border-black/10 text-[#AAA49C]"
      }`}>
        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
      </div>
    </div>
  );
}

export default function VerificationCenter() {
  useAutoTrack("verification_center");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { behavior, user, isVerified, track } = useBehavior();

  const [current, setCurrent] = useState(isVerified ? 4 : 0);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [method2fa, setMethod2fa] = useState("passkey");

  const advance = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 600)); // smooth visual transition
    setCurrent(c => c + 1);
    setProcessing(false);
  };

  const handlePay = async () => {
    if (!behavior?.id) return;
    setProcessing(true);
    track("verification_paid");
    const tokensGranted = 4; // 4 tokens × 5 = 20 credits
    const newBalance = (behavior.tokens_remaining || 0) + tokensGranted;
    await base44.entities.UserBehavior.update(behavior.id, {
      verification_paid: true,
      tokens_remaining: newBalance,
      tokens_purchased_total: (behavior.tokens_purchased_total || 0) + tokensGranted,
    });
    await base44.entities.TokenTransaction.create({
      user_email: behavior.user_email,
      type: "purchase",
      amount: tokensGranted,
      pack: "Verification bundle",
      price_usd: 8,
      balance_after: newBalance,
    });
    queryClient.invalidateQueries({ queryKey: ["user-behavior"] });
    setCurrent(4);
    setProcessing(false);
  };

  if (current >= 4) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-black/[0.07] shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(15,122,86,0.1)] mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#0F7A56]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">Verification complete</p>
          <h1 className="text-2xl font-black text-[#1A1814] mt-1">You're verified ✓</h1>
          <p className="text-sm text-[#6B6560] mt-2">
            Your account has been fully verified. You've received <strong className="text-[#D4A017]">20 ATI credits</strong> to get started.
          </p>
          <div className="mt-5 flex gap-2">
            <Link to="/" className="flex-1 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl transition-colors">
              Go to dashboard
            </Link>
            <Link to="/pricing" className="px-4 py-3 text-sm font-medium text-[#6B6560] hover:text-[#1A1814] border border-black/10 rounded-xl">
              Top up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const step = STEPS[current];

  return (
    <div className="min-h-screen bg-[#F7F4EF] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">Verification Center</p>
          <h1 className="text-3xl font-black text-[#1A1814] mt-1">Unlock full access in 2 minutes</h1>
          <p className="text-sm text-[#6B6560] mt-2">Join <strong>2,400+ verified dealers</strong> · Get 20 ATI credits instantly</p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-6 right-6 h-0.5 bg-black/5 -z-0">
              <div className="h-full bg-[#0F7A56] transition-all duration-500" style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }} />
            </div>
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5 relative z-10 bg-white px-1">
                <StepDot index={i} current={current} />
                <p className={`text-[10px] font-bold ${i <= current ? "text-[#1A1814]" : "text-[#AAA49C]"}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current step */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(212,160,23,0.12)] flex items-center justify-center">
              <step.icon className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1A1814]">Step {current + 1}: {step.label}</h2>
              <p className="text-[12px] text-[#6B6560]">{step.desc}</p>
            </div>
          </div>

          {current === 0 && (
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#D4A017]"
              />
              <p className="text-[11px] text-[#6B6560]">We use your login email — one click confirms it.</p>
              <button
                onClick={advance}
                disabled={!email || processing}
                className="w-full mt-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm email <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {current === 1 && (
            <div className="space-y-3">
              {!smsSent ? (
                <>
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block">Mobile number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#D4A017]"
                  />
                  <button
                    onClick={async () => { setProcessing(true); await new Promise(r => setTimeout(r, 700)); setSmsSent(true); setProcessing(false); }}
                    disabled={!phone || processing}
                    className="w-full mt-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send 6-digit code <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </>
              ) : (
                <>
                  <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block">Enter the code sent to {phone}</label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={e => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    placeholder="••••••"
                    className="w-full px-4 py-3 bg-[#F7F4EF] border border-black/10 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-[#D4A017]"
                  />
                  <button
                    onClick={advance}
                    disabled={smsCode.length !== 6 || processing}
                    className="w-full mt-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify phone <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <button onClick={() => setSmsSent(false)} className="w-full text-[11px] text-[#AAA49C] hover:text-[#1A1814]">Change number</button>
                </>
              )}
            </div>
          )}

          {current === 2 && (
            <div className="space-y-3">
              <p className="text-[12px] text-[#6B6560]">Choose a method to secure your account:</p>
              {[
                { id: "passkey", label: "SSL Passkey", desc: "Fastest · use your device biometrics" },
                { id: "app", label: "Authenticator app", desc: "Google Authenticator, Authy, 1Password" },
              ].map(m => (
                <label key={m.id} className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${method2fa === m.id ? "border-[#D4A017] bg-[rgba(212,160,23,0.06)]" : "border-black/10 hover:border-black/20"}`}>
                  <input type="radio" checked={method2fa === m.id} onChange={() => setMethod2fa(m.id)} className="accent-[#D4A017] mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1814]">{m.label}</p>
                    <p className="text-[11px] text-[#6B6560]">{m.desc}</p>
                  </div>
                </label>
              ))}
              <button
                onClick={advance}
                disabled={processing}
                className="w-full mt-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enable 2FA <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {current === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#D4A017]/10 to-[#F5C842]/5 border border-[#D4A017]/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#A67C00]">One-time payment</p>
                    <p className="text-3xl font-black text-[#1A1814] mt-0.5">$8</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#D4A017] font-black">
                      <Zap className="w-4 h-4" />
                      <span className="text-2xl">20</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B6560] font-semibold">ATI credits</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#D4A017]/20 space-y-1">
                  {["Instant account activation", "Verified dealer badge", "Credits never expire"].map(x => (
                    <div key={x} className="flex items-center gap-1.5 text-[11px] text-[#1A1814]">
                      <CheckCircle2 className="w-3 h-3 text-[#0F7A56]" /> {x}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-[#1A1814] hover:bg-[#111113] text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Pay $8 & get 20 credits</>}
              </button>
              <p className="text-[10px] text-center text-[#AAA49C]">Secure payment · Powered by Stripe · Cancel anytime</p>
            </div>
          )}
        </div>

        {current > 0 && current < 4 && (
          <button onClick={() => setCurrent(c => c - 1)} className="mt-3 text-[12px] text-[#AAA49C] hover:text-[#1A1814] block mx-auto">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}