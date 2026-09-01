
function CircularProgress({ value, color = "#3B82F6" }) {
  const size = 56,stroke = 4,r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = value / 100 * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
      strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="800" className="fill-foreground">{value}</text>
    </svg>);

}

export default function HomeDataCard() {
  return null;




































}