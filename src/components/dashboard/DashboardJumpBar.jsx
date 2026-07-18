import { Radio, Search, Gauge, Users } from "lucide-react";

const ITEMS = [
  { href: "#signal", label: "Signál", icon: Radio },
  { href: "#discover", label: "Objevit", icon: Search },
  { href: "#value", label: "Hodnotit", icon: Gauge },
  { href: "#community", label: "Komunita", icon: Users },
];

/**
 * DashboardJumpBar — sticky kotvový pruh pod hlavičkou.
 * Rychlá navigace mezi 4 logickými bandami dashboardu.
 */
export default function DashboardJumpBar() {
  return (
    <div className="sticky top-[76px] z-30 border-b border-black/[0.06] bg-[#fbfaf7]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1360px] items-center gap-1 overflow-x-auto px-4 py-2 md:px-8">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <a
              key={it.href}
              href={it.href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3a3a3a] transition hover:bg-[#D4A017]/10 hover:text-[#1a1a1a]"
            >
              <Icon size={13} /> {it.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}