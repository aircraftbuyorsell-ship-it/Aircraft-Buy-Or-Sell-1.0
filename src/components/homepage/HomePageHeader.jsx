import { Link } from "react-router-dom";
import { Grid2X2, Search } from "lucide-react";

const links = [
  ["Marketplace", "/marketplace"],
  ["Intelligence", "/ati-center"],
  ["Verify", "/ati-verify"],
  ["Pricing", "/pricing"],
];

export default function HomePageHeader() {
  return (
    <header className="relative z-30 flex h-16 items-center border-b border-border bg-card/90 px-5 backdrop-blur-xl sm:px-8">
      <Link to="/HomePage" className="flex items-center gap-2 font-bold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded border border-primary/25 text-sm italic text-primary">N</span>
        <span>ABOS</span>
      </Link>
      <nav className="mx-auto hidden items-center gap-8 text-xs font-medium md:flex">
        {links.map(([label, path]) => <Link key={label} to={path} className="hover:text-primary">{label}</Link>)}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/listings" aria-label="Search aircraft" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"><Search size={15} /></Link>
        <Link to="/intrazone" className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted"><Grid2X2 size={14} /> Workspace</Link>
      </div>
    </header>
  );
}