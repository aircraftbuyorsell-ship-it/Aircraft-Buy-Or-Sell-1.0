import { useState } from "react";
import { Coins, CalendarDays, Ticket } from "lucide-react";

const GIFT_LABELS = {
  bonus_tokens: { label: "200 Bonus Tokens", icon: Coins },
  extended_trial: { label: "45-Day Extended Pro", icon: CalendarDays },
  discount_voucher: { label: "€25 Voucher", icon: Ticket }
};

export default function ProTrialBanner({ trial }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!trial?.ok || dismissed) return null;

  const referralUrl = trial.referralSlug ?
  `${window.location.origin}/?ref=${trial.referralSlug}` :
  null;

  const endDate = trial.trialEndDate ? new Date(trial.trialEndDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / 86400000)) : 30;

  const gift = GIFT_LABELS[trial.giftChoice] || GIFT_LABELS.bonus_tokens;
  const GiftIcon = gift.icon;

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return null;











































}