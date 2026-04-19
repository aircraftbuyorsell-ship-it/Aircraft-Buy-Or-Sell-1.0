export default function ReserveCard({ label, perHour, annualCost, hoursRemaining, status, color = "#0B2D5B" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold">{label}</p>
        {status && (
          <span
            className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {status}
          </span>
        )}
      </div>
      <p className="text-xl font-black text-[#1A1814] mt-1">${Math.round(annualCost).toLocaleString()}<span className="text-xs text-[#AAA49C] font-normal">/yr</span></p>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/[0.05] text-[10px] text-[#6B6560]">
        <span>${perHour}/hr reserve</span>
        {hoursRemaining != null && (
          <span className="font-semibold" style={{ color }}>
            {hoursRemaining > 0 ? `${hoursRemaining.toLocaleString()} hr left` : `${Math.abs(hoursRemaining).toLocaleString()} hr over`}
          </span>
        )}
      </div>
    </div>
  );
}