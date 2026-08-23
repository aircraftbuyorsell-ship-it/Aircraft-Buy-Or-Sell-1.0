import { Gift, Sparkles, ArrowRight, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function TrialPromoBanner({ trial, onClaimGift }) {
  const { user, navigateToLogin } = useAuth();

  if (trial?.alreadyGranted) return null;

  const slotsLeft = trial?.slotsLeft;
  const isLoggedIn = !!user;
  const isFull = slotsLeft === 0;

  const handlePrimary = () => {
    if (!isLoggedIn) return navigateToLogin();
    if (!isFull) onClaimGift?.();
  };

  const handleGift = () => {
    if (!isLoggedIn) return navigateToLogin();
    onClaimGift?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-bold text-foreground">
                First 50 Members Get 30 Days of Pro — Free
              </h3>
              {slotsLeft !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Users className="h-3 w-3" />
                  {isFull ? "Full" : `${slotsLeft} left`}
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground">
              Full Pro access: ATI reports, Deal Radar, leads & more. Pick your investment gift on signup.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleGift}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Gift className="h-3.5 w-3.5" />
            Claim gift
          </button>
          <button
            onClick={handlePrimary}
            disabled={isLoggedIn && isFull}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[13px] font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoggedIn ? (isFull ? "Sold out" : "Start free trial") : "Get started free"}
            {!isFull && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}