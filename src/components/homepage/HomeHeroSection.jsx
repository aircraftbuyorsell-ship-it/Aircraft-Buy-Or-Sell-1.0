import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import HomeDataCard from "@/components/homepage/HomeDataCard";

const ANNOTATIONS = [
{ label: "SERIAL", value: "505E01147", style: { top: "16%", left: "8%" } },
{ label: "ENG", value: "2217 HRS", style: { top: "48%", left: "2%" } },
{ label: "LANDINGS", value: "1,042", style: { bottom: "22%", right: "30%" } }];


export default function HomeHeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <HeroGlobe />
      </div>
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pt-32 pb-12 sm:px-8 sm:pt-36 sm:pb-16 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text content */}
          <div className="flex flex-col items-start text-left order-2 lg:order-1">
            <span className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Price it right. Verify the tail.
            </span>
            <h1 className="mb-5 tracking-[-0.02em] leading-[1.05] text-foreground"
            style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700 }}>
              Price any aircraft<br />by its real condition.
            </h1>
            <p className="mb-7 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
              Enter a tail number to pull registry &amp; maintenance data, then get a market value that reflects the aircraft's actual condition — not just the listing price.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link to="/valuation-studio"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]">
                <Search className="h-5 w-5" /> Check aircraft price
              </Link>
              <Link to="/n-lookup"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Look up a tail number <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Aircraft image with annotations + data card */}
          <div className="relative order-1 lg:order-2">
            


            
            

            {/* Annotations — desktop only */}
            {ANNOTATIONS.map((a) =>
            <div key={a.label} className="absolute hidden items-center gap-2 lg:flex" style={a.style}>
                
                
                

              
              </div>
            )}

            {/* Data card */}
            <div className="mt-4 lg:absolute lg:bottom-6 lg:right-6 lg:z-10 lg:mt-0 lg:w-[290px]">
              <HomeDataCard />
            </div>
          </div>
        </div>
      </div>
    </section>);

}