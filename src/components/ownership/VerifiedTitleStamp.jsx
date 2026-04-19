import { ShieldCheck, Lock } from "lucide-react";

// Stamp badge shown on ATI Score Card when ownership chain is verified
export default function VerifiedTitleStamp({ verifiedCount, totalCount, size = "md" }) {
  const isVerified = verifiedCount > 0 && verifiedCount === totalCount;
  const partial = verifiedCount > 0 && verifiedCount < totalCount;

  const sz = size === "lg"
    ? { wrap: "w-28 h-28", icon: "w-7 h-7", title: "text-[10px]", count: "text-[18px]" }
    : { wrap: "w-20 h-20", icon: "w-5 h-5", title: "text-[8px]", count: "text-[13px]" };

  const color = isVerified ? "#0F7A56" : partial ? "#E8A83A" : "#AAA49C";
  const bg = isVerified ? "rgba(15,122,86,0.08)" : partial ? "rgba(232,168,58,0.08)" : "rgba(0,0,0,0.04)";

  return (
    <div
      className={`${sz.wrap} rounded-full border-2 flex flex-col items-center justify-center relative shrink-0`}
      style={{ borderColor: color, backgroundColor: bg }}
    >
      {isVerified ? (
        <ShieldCheck className={sz.icon} style={{ color }} strokeWidth={2.5} />
      ) : (
        <Lock className={sz.icon} style={{ color }} strokeWidth={2.5} />
      )}
      <p
        className={`${sz.title} uppercase tracking-wider font-black mt-0.5 leading-none text-center px-1`}
        style={{ color }}
      >
        {isVerified ? "Verified Title" : partial ? "Partial" : "Unverified"}
      </p>
      {totalCount > 0 && (
        <p className={`${sz.count} font-black leading-none`} style={{ color }}>
          {verifiedCount}/{totalCount}
        </p>
      )}
    </div>
  );
}