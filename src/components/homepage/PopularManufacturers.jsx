import { Link } from "react-router-dom";

const MAKES = ["Cessna", "Gulfstream", "Bombardier", "Dassault", "Embraer", "Beechcraft", "Piper", "Cirrus", "Pilatus", "Airbus", "Boeing"];

export default function PopularManufacturers() {
  return (
    <div className="flex flex-wrap gap-2.5">
      {MAKES.map((make) => (
        <Link
          key={make}
          to={`/listings?make=${encodeURIComponent(make)}`}
          className="rounded-full border border-black/[0.09] bg-white px-4 py-2 text-[12px] font-semibold text-[#3a3a3a] transition-colors hover:border-[#D4A017]/50 hover:bg-[#D4A017]/[0.06] hover:text-[#1a1a1a]"
        >
          {make}
        </Link>
      ))}
    </div>
  );
}