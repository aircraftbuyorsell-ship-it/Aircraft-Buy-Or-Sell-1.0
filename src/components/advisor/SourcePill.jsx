export default function SourcePill({ source }) {
  if (!source) return null;
  const isLicensed = /engine ?spec|ati card|licensed|marketplace/i.test(source);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isLicensed ? "border-[#c99635]/40 bg-[#c99635]/10 text-[#a87925]" : "border-[#102033]/10 bg-[#102033]/[0.03] text-[#102033]/50"}`}>
      {source}
    </span>
  );
}