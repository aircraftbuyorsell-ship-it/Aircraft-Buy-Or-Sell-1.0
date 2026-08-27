import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  ShieldCheck,
  TrendingUp,
  FileText,
  Mail,
  CalendarDays,
  Landmark,
  Radar,
  Zap,
  Scale,
  Calculator,
  BadgeCheck,
  GitBranch,
  FileCheck,
  BarChart3,
  Globe2,
  Umbrella,
  Percent,
  Sparkles,
  Users,
  Cpu,
  Paintbrush,
  Armchair,
  SlidersHorizontal,
  PieChart,
  Bot
} from "lucide-react";
import SkillCard from "@/components/skills/SkillCard";

const CATEGORIES = [
  {
    id: "core",
    label: "Core Intelligence",
    blurb: "Verification, scoring and valuation — the deterministic core of the platform."
  },
  {
    id: "deal",
    label: "Deal Execution",
    blurb: "First contact through to a documented, closed transaction."
  },
  {
    id: "cost",
    label: "Cost & Ownership",
    blurb: "What the aircraft actually costs to hold, insure and operate."
  },
  {
    id: "upgrade",
    label: "Upgrades & Refurbishment",
    blurb: "Scope and price work on the airframe, cabin and panel."
  },
  {
    id: "advisory",
    label: "Investment & Advisory",
    blurb: "Ownership economics and conversational access to the remaining models."
  }
];

const SKILLS = [
  {
    icon: ShieldCheck,
    title: "ATI Scoring",
    badge: "Default Skill",
    category: "core",
    color: "#4e8ef7",
    path: "/ati-quick-score",
    description:
      "Scores aircraft transparency across 8 dimensions — documentation, engine condition, avionics, storage and transaction readiness."
  },
  {
    icon: FileCheck,
    title: "ATI Full Report",
    badge: "Report",
    category: "core",
    color: "#4e8ef7",
    path: "/ati-full-report",
    description:
      "Full due-diligence dossier — 8-dimension breakdown, risk flags and a branded report for buyers, brokers and lenders."
  },
  {
    icon: Zap,
    title: "Digital Twin Verification",
    badge: "Default Skill",
    category: "core",
    color: "#f5c242",
    path: "/n-lookup",
    description:
      "Builds an independent Digital Twin from FAA registry, ADS-B traffic and engine spec data with 3-source integrity cross-check."
  },
  {
    icon: TrendingUp,
    title: "Expert Valuation",
    badge: "Default Skill",
    category: "core",
    color: "#5dcaa5",
    path: "/valuation-studio",
    description:
      "Generates market appraisals from live comparables, condition data and deal-quality scoring with discount detection."
  },
  {
    icon: BarChart3,
    title: "Market Report",
    badge: "Market Data",
    category: "core",
    color: "#f5c242",
    path: "/market-reports",
    description:
      "Make and model analysis with price trends and comparable listings, with the contributing sources disclosed on every figure."
  },
  {
    icon: Globe2,
    title: "Registry Comparator",
    badge: "Cross-Registry",
    category: "core",
    color: "#5dcaa5",
    path: "/registry-comparator",
    description:
      "Cross-checks FAA, EASA and CAA records for the same airframe and flags compliance and data gaps between registries."
  },
  {
    icon: BadgeCheck,
    title: "Expert Crosscheck",
    badge: "Human Moat",
    category: "core",
    color: "#f5c242",
    path: "/experts",
    description:
      "Routes verification requests to certified A&P, IA and EASA experts from the 280k-member community network."
  },
  {
    icon: Radar,
    title: "Deal Radar",
    badge: "Default Skill",
    category: "deal",
    color: "#e24b4a",
    path: "/deal-radar",
    description:
      "Continuously scans the market for undervalued aircraft — flags listings priced 8%+ below expert market value."
  },
  {
    icon: Scale,
    title: "Aircraft Comparison",
    badge: "Default Skill",
    category: "deal",
    color: "#a78bfa",
    path: "/compare",
    description:
      "Side-by-side comparison of aircraft listings across specs, ATI scores, pricing and total cost of ownership."
  },
  {
    icon: FileText,
    title: "Contract Generator",
    badge: "Google Docs",
    category: "deal",
    color: "#a78bfa",
    path: "/sales-pipeline",
    description:
      "Drafts aircraft purchase agreements in Google Docs pre-filled with pipeline data — parties, price, conditions and signatures."
  },
  {
    icon: Mail,
    title: "Deal Notifications",
    badge: "Gmail",
    category: "deal",
    color: "#5dcaa5",
    path: "/sales-pipeline",
    description:
      "Sends contracts and deal notifications to buyers directly from the sales pipeline via Gmail."
  },
  {
    icon: CalendarDays,
    title: "Inspection Scheduler",
    badge: "Calendar",
    category: "deal",
    color: "#4e8ef7",
    path: "/sales-pipeline",
    description:
      "Books pre-buy inspections and closing dates in Google Calendar with automatic attendee invitations."
  },
  {
    icon: Landmark,
    title: "Escrow Management",
    badge: "Default Skill",
    category: "deal",
    color: "#e2a44b",
    path: "/escrow",
    description:
      "Manages transaction escrow from contract to release — Stripe or USDC funding, finder's fees and settlement tracking."
  },
  {
    icon: GitBranch,
    title: "Sales Pipeline Spider",
    badge: "Workflow",
    category: "deal",
    color: "#f5c242",
    path: "/sales-pipeline",
    description:
      "End-to-end deal workflow — from Digital Twin init through AI document review to contract, escrow and closing."
  },
  {
    icon: Calculator,
    title: "OPEX Engine",
    badge: "Default Skill",
    category: "cost",
    color: "#4e8ef7",
    path: "/opex-calculator",
    description:
      "Models full operating costs — fuel, maintenance reserves, hangar, insurance and hourly rates per aircraft type."
  },
  {
    icon: Umbrella,
    title: "Insurance Premium",
    badge: "Calculator",
    category: "cost",
    color: "#5dcaa5",
    path: "/insurance-calculator",
    description:
      "Estimates hull and liability premium from insured value, pilot experience and the deductible you choose."
  },
  {
    icon: Percent,
    title: "Leasing & Tax",
    badge: "Calculator",
    category: "cost",
    color: "#4e8ef7",
    path: "/leasing-calculator",
    description:
      "Dry lease rate estimate, tax benefit analysis and residual value projection for leased or financed airframes."
  },
  {
    icon: Sparkles,
    title: "Aircraft Detailing",
    badge: "Calculator",
    category: "cost",
    color: "#5dcaa5",
    path: "/aircraft-detailing-calculator",
    description:
      "Prices exterior wash and wax plus interior deep clean from labour hours and material inputs."
  },
  {
    icon: Users,
    title: "Fractional Ownership",
    badge: "Calculator",
    category: "cost",
    color: "#f5c242",
    path: "/fractional-calculators",
    description:
      "Splits acquisition and operating cost across shares with a per-owner breakdown and usage allocation."
  },
  {
    icon: Cpu,
    title: "Avionics Upgrade",
    badge: "Calculator",
    category: "upgrade",
    color: "#a78bfa",
    path: "/avionics-upgrade-calculator",
    description:
      "Estimates glass panel retrofit, transponder and ADS-B installation cost including labour and parts."
  },
  {
    icon: Paintbrush,
    title: "Exterior Refurbishment",
    badge: "Calculator",
    category: "upgrade",
    color: "#e2a44b",
    path: "/exterior-refurbishment-calculator",
    description:
      "Estimates full repaint, polish and corrosion treatment cost based on current airframe condition."
  },
  {
    icon: Armchair,
    title: "Interior Refurbishment",
    badge: "Calculator",
    category: "upgrade",
    color: "#e24b4a",
    path: "/interior-refurbishment-calculator",
    description:
      "Estimates seat reupholstery, cabin panelling and carpet cost across the available material grades."
  },
  {
    icon: SlidersHorizontal,
    title: "Upgrade Comparison",
    badge: "Calculator",
    category: "upgrade",
    color: "#4e8ef7",
    path: "/upgrade-comparison",
    description:
      "Compares upgrade options side by side with ROI per upgrade and a combined project total."
  },
  {
    icon: PieChart,
    title: "Investment Brief",
    badge: "AI Analysis",
    category: "advisory",
    color: "#a78bfa",
    path: "/investment-brief",
    description:
      "Ownership economics for a candidate airframe — health analysis, ROI projection and a financial risk score."
  },
  {
    icon: Bot,
    title: "Pricing Assistant",
    badge: "AI Agent",
    category: "advisory",
    color: "#5dcaa5",
    path: "/finance-advisor",
    description:
      "Conversational access to the models with no page of their own — rebuild ROI, engine and prop overhaul, MRO schedule, timebuilding and fleet change."
  }
];

const SEO_TITLE =
  "Aviation Skills — ATI Scoring, Valuation, OPEX & MRO Calculators | ABOS";
const SEO_DESCRIPTION =
  "Every ABOS aviation skill in one place: ATI transparency scoring, OMVM valuation, Digital Twin verification, OPEX, insurance, leasing, MRO and upgrade calculators.";
const SEO_LD_ID = "abos-skills-itemlist";
const SEO_MARK = "data-abos-seo";

function categoryLabel(id) {
  const found = CATEGORIES.find(function (c) {
    return c.id === id;
  });
  return found ? found.label : "";
}

function applySkillsSeo(skills) {
  if (typeof document === "undefined") return;

  const origin = window.location.origin;
  const canonical = origin + "/skills";

  document.title = SEO_TITLE;

  const upsertMeta = function (attr, key, content) {
    let el = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      el.setAttribute(SEO_MARK, "skills");
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  upsertMeta("name", "description", SEO_DESCRIPTION);
  upsertMeta("property", "og:title", SEO_TITLE);
  upsertMeta("property", "og:description", SEO_DESCRIPTION);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("name", "twitter:title", SEO_TITLE);
  upsertMeta("name", "twitter:description", SEO_DESCRIPTION);

  let canonicalEl = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement("link");
    canonicalEl.setAttribute("rel", "canonical");
    canonicalEl.setAttribute(SEO_MARK, "skills");
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute("href", canonical);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ABOS Aviation Skills",
    description: SEO_DESCRIPTION,
    url: canonical,
    numberOfItems: skills.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: skills.map(function (skill, index) {
      const skillUrl = origin + skill.path;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: skill.title,
        url: skillUrl,
        item: {
          "@type": "SoftwareApplication",
          name: skill.title,
          description: skill.description,
          url: skillUrl,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          category: categoryLabel(skill.category),
          provider: { "@type": "Organization", name: "ABOS" }
        }
      };
    })
  };

  let ld = document.getElementById(SEO_LD_ID);
  if (!ld) {
    ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = SEO_LD_ID;
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(itemList);
}

function useSkillsSeo(skills) {
  useEffect(function () {
    const previousTitle = document.title;
    applySkillsSeo(skills);

    // The platform writes its own head tags on route change, so re-assert ours
    // shortly after mount rather than losing the page-specific copy.
    const timers = [
      window.setTimeout(function () {
        applySkillsSeo(skills);
      }, 400),
      window.setTimeout(function () {
        applySkillsSeo(skills);
      }, 1500)
    ];

    return function () {
      timers.forEach(function (t) {
        window.clearTimeout(t);
      });
      document.title = previousTitle;
      const ld = document.getElementById(SEO_LD_ID);
      if (ld && ld.parentNode) ld.parentNode.removeChild(ld);
      Array.prototype.forEach.call(
        document.head.querySelectorAll("[" + SEO_MARK + '="skills"]'),
        function (el) {
          if (el.parentNode) el.parentNode.removeChild(el);
        }
      );
    };
  }, [skills]);
}

function Chip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
      style={{
        background: active ? "rgba(245,194,66,0.14)" : "rgba(255,255,255,0.04)",
        border: active
          ? "0.5px solid rgba(245,194,66,0.45)"
          : "0.5px solid rgba(255,255,255,0.1)",
        color: active ? "#f5c242" : "rgba(255,255,255,0.55)"
      }}
    >
      {label}
      <span className="ml-1.5 opacity-60">{count}</span>
    </button>
  );
}

export default function Skills() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useSkillsSeo(SKILLS);

  const filtered = useMemo(
    function () {
      const needle = query.trim().toLowerCase();
      return SKILLS.filter(function (skill) {
        if (activeCategory !== "all" && skill.category !== activeCategory) return false;
        if (!needle) return true;
        const haystack = (
          skill.title +
          " " +
          skill.description +
          " " +
          skill.badge +
          " " +
          categoryLabel(skill.category)
        ).toLowerCase();
        return haystack.indexOf(needle) > -1;
      });
    },
    [query, activeCategory]
  );

  const groups = useMemo(
    function () {
      return CATEGORIES.map(function (category) {
        return {
          category: category,
          items: filtered.filter(function (skill) {
            return skill.category === category.id;
          })
        };
      }).filter(function (group) {
        return group.items.length > 0;
      });
    },
    [filtered]
  );

  const resetFilters = function () {
    setQuery("");
    setActiveCategory("all");
  };

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#f5c242] mb-1">
              ABOS Aviation OS
            </p>
            <h1 className="text-2xl font-black text-[rgba(255,255,255,0.92)]">Available Skills</h1>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-[rgba(255,255,255,0.45)]">
              Deterministic engines, document workflows and human verification — every skill the
              platform exposes to the app and to connected AI clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/feature-requests"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
              style={{ background: "rgba(255,255,255,0.9)", color: "#0a0a12" }}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Request Skill
            </Link>

            <div className="relative">
              <label htmlFor="skills-search" className="sr-only">
                Search skills
              </label>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]"
              />
              <input
                id="skills-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={function (e) {
                  setQuery(e.target.value);
                }}
                placeholder="Search Skills…"
                className="w-44 sm:w-56 pl-8 pr-8 py-2 rounded-lg text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "#fff"
                }}
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={function () {
                    setQuery("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[rgba(255,255,255,0.4)] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242]"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div
          role="group"
          aria-label="Filter skills by category"
          className="mb-3 flex flex-wrap gap-2"
        >
          <Chip
            label="All"
            count={SKILLS.length}
            active={activeCategory === "all"}
            onClick={function () {
              setActiveCategory("all");
            }}
          />
          {CATEGORIES.map(function (category) {
            const count = SKILLS.filter(function (skill) {
              return skill.category === category.id;
            }).length;
            return (
              <Chip
                key={category.id}
                label={category.label}
                count={count}
                active={activeCategory === category.id}
                onClick={function () {
                  setActiveCategory(category.id);
                }}
              />
            );
          })}
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mb-6 text-[11px] text-[rgba(255,255,255,0.35)]"
        >
          {filtered.length === SKILLS.length
            ? "Showing all " + SKILLS.length + " skills"
            : "Showing " + filtered.length + " of " + SKILLS.length + " skills"}
        </p>

        {/* Skills grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] text-[rgba(255,255,255,0.4)]">
              No skills match {query ? '"' + query + '"' : "this filter"}.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242]"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)"
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(function (group) {
              return (
                <section
                  key={group.category.id}
                  aria-labelledby={"skills-heading-" + group.category.id}
                >
                  <div className="mb-3">
                    <h2
                      id={"skills-heading-" + group.category.id}
                      className="text-[11px] uppercase tracking-[0.18em] font-black text-[rgba(255,255,255,0.7)]"
                    >
                      {group.category.label}
                    </h2>
                    <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.35)]">
                      {group.category.blurb}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.items.map(function (skill) {
                      return <SkillCard key={skill.title} skill={skill} />;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}