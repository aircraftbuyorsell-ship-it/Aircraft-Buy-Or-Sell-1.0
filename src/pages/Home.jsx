import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, ArrowRight, MapPin, Star, ChevronDown, Info, ExternalLink, ShieldCheck, FileText, Wrench, AlertTriangle, Users, Activity, Plane, Plus, Minus } from "lucide-react";

// --- Global Styles for Animations ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes eYuqoB { 0% { opacity: 0.4; } 100% { opacity: 1; } }
    @keyframes dKTtel { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes icon-spin{0%{transform:rotate(0)}to{transform:rotate(359deg)}}
    @keyframes tripledot-bounce{0%,to{opacity:1}60%{opacity:0}}
    @keyframes bars-pulse{50%{opacity:1}}
    @keyframes circle-rotate{0%{transform:rotate(0)}80%,to{transform:rotate(360deg)}}
    @keyframes floatA { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(3deg); } }
    @keyframes floatB { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-2deg); } }
    @keyframes floatC { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-25px) scale(1.05); } }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `}} />
);

const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setIsVisible(true); return; }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 200px 0px" }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className || ""}`}
    >
      {children}
    </div>
  );
};

function HeroSection() {
  const [nNumber, setNNumber] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setNNumber(val);
    setCharCount(val.length);
  };

  const handleCheck = () => {
    if (nNumber.trim()) {
      window.open(`https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nNumber}`, "_blank");
    }
  };

  return (
    <section className="relative min-h-[90vh] bg-background flex flex-col items-center justify-center pt-24">
      {/* Decorative background lines to mimic the vehicle sketch in screenshot */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] text-foreground flex items-center justify-center overflow-hidden">
         <svg className="w-[120%] max-w-[1600px] h-auto absolute" viewBox="0 0 1000 400" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M 100 200 C 300 150, 600 100, 900 250" />
            <path d="M 200 250 L 400 180 L 500 180 L 700 280" />
            <circle cx="200" cy="200" r="100" />
            <circle cx="800" cy="250" r="80" />
            <path d="M 50 100 L 950 100" strokeDasharray="5,5" />
         </svg>
      </div>

      {/* Floating orbs for depth */}
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" style={{ animation: "floatA 8s ease-in-out infinite" }} />
      <div className="absolute bottom-20 left-[10%] w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" style={{ animation: "floatB 10s ease-in-out infinite" }} />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full flex flex-col items-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-8">
            Check Any Aircraft <span className="text-accent inline-block mx-1">•</span> Online
          </h1>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-10">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
              </div>
              Data Directly from FAA
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
              </div>
              US History Records
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
              </div>
              300M+ Records
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full max-w-3xl">
            <div className="bg-background rounded-full p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border flex flex-col sm:flex-row items-center gap-2 relative z-20 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] transition-shadow duration-300">
              <div className="flex-1 w-full relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">N</span>
                 <input
                    value={nNumber}
                    onChange={handleInput}
                    placeholder="Enter N-Number"
                    className="w-full pl-12 pr-6 py-4 bg-transparent border-none text-foreground placeholder:text-muted-foreground text-lg focus:outline-none focus:ring-0"
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                 />
              </div>
              
              <div className="hidden sm:block text-muted-foreground text-sm font-medium px-4 border-l border-border whitespace-nowrap">
                {charCount} / 6 characters
              </div>

              <button
                onClick={handleCheck}
                className="w-full sm:w-auto relative overflow-hidden px-10 py-4 bg-accent text-accent-foreground rounded-full font-bold text-base hover:bg-accent/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2s_infinite]" />
                <span className="relative">Check Now</span>
                <ArrowRight className="w-4 h-4 relative" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-between items-center mt-6 text-sm text-muted-foreground px-4 gap-4">
              <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                Where can I find the N-Number? <Info className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Registered User Login
              </a>
            </div>
          </div>

          {/* Google Rating */}
          <div className="mt-16 mb-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-foreground">Google</span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Join thousands of satisfied customers</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">4.8</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#FBBC04] text-[#FBBC04]" />)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
         <div className="w-1 h-1 rounded-full bg-foreground" />
         <div className="w-1 h-1 rounded-full bg-foreground" />
         <div className="w-1 h-1 rounded-full bg-foreground" />
      </div>
    </section>
  );
}

function ChecksSection() {
  const checks = [
    { title: "Accident Records", desc: "Find out if the aircraft was damaged in a past accident or incident.", img: "https://media.base44.com/images/public/6a33a01de9cb776612c9b15d/3cb5ec798_cz_cebia_com_damage-C_7TxDl5_6f325809.webp" },
    { title: "Ownership History", desc: "Track the full chain of ownership and verify there are no outstanding liens.", img: "https://media.base44.com/images/public/6a33a01de9cb776612c9b15d/c98596ba7_cz_cebia_com_history-C2ZK0OZR_436cf463.webp" },
    { title: "Maintenance Records", desc: "Verify FAA service records and repair history for the aircraft.", img: "https://media.base44.com/images/public/6a33a01de9cb776612c9b15d/7a6d15081_cz_cebia_com_service-BDmqS_fQ_40cf1bb9.webp" },
    { title: "Photos & Listings", desc: "Check if the aircraft was listed for sale and in what condition.", img: "https://media.base44.com/images/public/6a33a01de9cb776612c9b15d/bd0defd53_cz_cebia_com_photos-CY-aytDY_f8b7d769.webp" },
  ];

  return (
    <section className="py-24 bg-background overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedElement>
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-foreground">We check every aircraft for</h2>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium bg-secondary text-secondary-foreground px-4 py-2 rounded-full">
              1 / {checks.length}
            </div>
          </div>
        </AnimatedElement>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {checks.map((item, index) => (
            <AnimatedElement key={index} delay={index * 100}>
              <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col">
                <div className="p-6 pb-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.desc}</p>
                </div>
                <div className="px-6 pb-6 pt-2 h-48 overflow-hidden relative rounded-b-2xl">
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[90%] bg-muted rounded-t-xl overflow-hidden border border-border border-b-0 shadow-lg group-hover:h-[95%] transition-all duration-500">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                   </div>
                </div>
              </div>
            </AnimatedElement>
          ))}
        </div>
        
        {/* Pagination dots */}
        <AnimatedElement delay={400}>
           <div className="flex justify-center gap-2 mt-12">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="w-2 h-2 rounded-full bg-border" />
              <div className="w-2 h-2 rounded-full bg-border" />
              <div className="w-2 h-2 rounded-full bg-border" />
           </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function SampleReportSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute w-[800px] h-[800px] border-[1px] border-border rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
      <div className="absolute w-[1200px] min-h-[600px] border-[1px] border-border rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30" />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <AnimatedElement>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                See what a full report can include in our{" "}
                <a href="#" className="text-primary underline decoration-2 underline-offset-8 hover:text-accent transition-colors">
                  Sample Report
                </a>.
              </h2>
            </div>
            
            <div className="relative group cursor-pointer">
              {/* Tablet Mockup Container */}
              <div className="relative rounded-3xl bg-foreground p-3 shadow-2xl shadow-primary/20 transform group-hover:-translate-y-2 group-hover:shadow-3xl group-hover:shadow-primary/30 transition-all duration-500">
                {/* Screen */}
                <div className="relative rounded-2xl overflow-hidden bg-background aspect-[16/10] border border-foreground/20">
                  {/* Top bar fake */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-muted/80 backdrop-blur border-b border-border z-20 flex items-center px-4">
                     <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                     </div>
                     <div className="mx-auto text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> FAA Report
                     </div>
                  </div>
                  
                  {/* Mock content */}
                  <div className="w-full h-full pt-6">
                     <div className="h-1/3 bg-primary w-full p-6 text-primary-foreground flex flex-col justify-end">
                        <div className="text-xs opacity-70 mb-1">Aircraft History Report</div>
                        <div className="text-2xl font-bold">N12345 - Cessna 172S</div>
                     </div>
                     <div className="p-6 grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                           <div className="h-2 w-3/4 bg-muted rounded" />
                           <div className="h-2 w-full bg-muted rounded" />
                           <div className="h-2 w-5/6 bg-muted rounded" />
                        </div>
                        <div className="relative">
                           <div className="absolute bottom-0 right-0 w-32 h-24 bg-accent/10 rounded-tl-full" />
                           <div className="absolute bottom-4 right-4 text-accent"><CheckCircle className="w-8 h-8" /></div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Dark overlay & Play button */}
                  <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-8 h-8 ml-1 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating label */}
              <div className="absolute -bottom-6 -right-6 bg-background rounded-full px-6 py-3 shadow-lg border border-border flex items-center gap-2 text-sm font-bold text-foreground">
                 Watch on <Play className="w-4 h-4 text-red-600 fill-current" /> YouTube
              </div>
            </div>
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function AircraftTypesSection() {
  const types = [
    { title: "Helicopters", desc: "Single-engine, twin-engine, turbine rotorcraft.", icon: <Activity className="w-8 h-8" /> },
    { title: "Single-Engine Piston", desc: "Cessna, Piper, Cirrus, Beechcraft and more.", icon: <Plane className="w-8 h-8" /> },
    { title: "Turboprops", desc: "King Air, Caravan, Pilatus and utility aircraft.", icon: <Plane className="w-8 h-8" /> },
    { title: "Business Jets", desc: "Citation, Gulfstream, Learjet, and more.", icon: <Plane className="w-8 h-8" /> },
    { title: "Commercial Airliners", desc: "Regional, narrow-body, and wide-body aircraft.", icon: <Users className="w-8 h-8" /> },
  ];

  return (
    <section className="py-24 bg-secondary/50">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            Check any aircraft easily and quickly
          </h2>
        </AnimatedElement>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {types.map((t, i) => (
            <AnimatedElement key={i} delay={i * 80}>
              <div className="p-8 rounded-2xl bg-card border border-border/50 text-center hover:-translate-y-1.5 hover:shadow-xl hover:border-border transition-all duration-300 cursor-pointer h-full flex flex-col items-center">
                <div className="text-foreground/80 mb-4 transition-colors">
                  {t.icon}
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataSourcesSection() {
  const checkItems = [
    "FAA Registry", "NTSB Database", 
    "Insurance Records", "Maintenance Facilities",
    "Aircraft Dealers", "Leasing Companies",
    "Listing Portals", "Law Enforcement",
    "Service Centers", "Pre-owned Sales"
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedElement>
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Records sourced from over <span className="text-primary">2,000 partners</span>
            </h2>
            <p className="text-muted-foreground text-lg">The FAA database is the largest of its kind in the world</p>
          </div>
        </AnimatedElement>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimatedElement delay={100} className="relative">
            {/* Visual composition mimicking the screenshot's mobile/UI overlap */}
            <div className="relative w-full aspect-square max-w-lg mx-auto">
               <div className="absolute inset-0 bg-secondary rounded-full opacity-50 scale-90" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 bg-card rounded-[2rem] border-8 border-foreground shadow-2xl p-4 transform -rotate-6 z-20">
                     <div className="w-full h-10 bg-muted rounded-xl mb-4" />
                     <div className="w-full h-32 bg-primary rounded-xl mb-4 flex items-center justify-center text-primary-foreground"><Plane className="w-12 h-12" /></div>
                     <div className="space-y-2">
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                     </div>
                  </div>
               </div>
               {/* Floating tags */}
               <div className="absolute top-1/4 -right-4 bg-card px-4 py-2 rounded-xl shadow-xl border border-border z-30 flex items-center gap-2 transform rotate-3">
                  <FileText className="w-4 h-4 text-accent" /> Databases <CheckCircle className="w-4 h-4 text-accent ml-2" />
               </div>
               <div className="absolute top-1/2 -right-8 bg-card px-4 py-2 rounded-xl shadow-xl border border-border z-30 flex items-center gap-2 transform -rotate-2">
                  <Wrench className="w-4 h-4 text-accent" /> Service Centers <CheckCircle className="w-4 h-4 text-accent ml-2" />
               </div>
               <div className="absolute bottom-1/3 -right-2 bg-card px-4 py-2 rounded-xl shadow-xl border border-border z-30 flex items-center gap-2 transform rotate-6">
                  <ShieldCheck className="w-4 h-4 text-accent" /> Insurance <CheckCircle className="w-4 h-4 text-accent ml-2" />
               </div>
            </div>
          </AnimatedElement>

          <AnimatedElement delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {checkItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-foreground p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
}

function WorldMapSection() {
  const regions = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma",
    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  return (
    <section className="py-24 bg-primary relative overflow-hidden text-center text-primary-foreground">
      {/* Abstract dotted map representation */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 2px, transparent 2px)", backgroundSize: "30px 30px" }} />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl sm:text-4xl font-bold mb-16 leading-tight">
            We check aircraft<br />across all 50 US states
          </h2>
        </AnimatedElement>

        <AnimatedElement delay={100}>
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {regions.map((region, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-background text-foreground text-xs font-bold shadow-lg hover:-translate-y-1 transition-transform cursor-default">
                <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                   <span className="text-[8px] opacity-50">FL</span>
                </div>
                {region}
              </span>
            ))}
          </div>
          
          <div className="max-w-2xl mx-auto">
             <p className="text-primary-foreground/80 text-sm leading-relaxed font-medium">
               FAA grants access to aircraft data from across the entire United States.<br />
               This allows us to provide accurate history information regardless of where the aircraft is registered.
             </p>
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "1", title: "Enter N-Number", desc: "The N-Number is the unique registration number of every US-registered aircraft. You'll find it on the fuselage or in the aircraft documents." },
    { num: "2", title: "Available Data", desc: "An overview of available checks is immediately displayed after entering the N-Number from the FAA database." },
    { num: "3", title: "Payment", desc: "Choose a report package and complete payment through our secure payment gateway." },
    { num: "4", title: "Report Results", desc: "Your report is available immediately after payment. We'll also send it to your email." },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl font-bold text-foreground text-center mb-20">How it works</h2>
        </AnimatedElement>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <AnimatedElement key={i} delay={i * 100}>
              <div className="flex flex-col text-left group">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-6 group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                  {s.num}
                </div>
                <h3 className="font-bold text-foreground mb-3 text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfessionalsSection() {
  const logos = [
    { name: "AURESHOLDINGS" }, { name: "ČESKÁ POJIŠŤOVNA" }, { name: "Kooperativa" }, 
    { name: "ČPP" }, { name: "Allianz" }, { name: "UNIQA" }
  ];
  return (
    <section className="py-16 bg-background border-t border-border/50">
      <div className="max-w-[1400px] mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">Trusted by aviation professionals</h2>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-center">
            {logos.map((logo, i) => (
              <div key={i} className="px-6 py-4 rounded-xl bg-card border border-border flex items-center justify-center hover:shadow-md transition-shadow grayscale hover:grayscale-0 opacity-60 hover:opacity-100 min-w-[140px]">
                <span className="font-bold text-sm text-foreground/80 tracking-wide uppercase">{logo.name}</span>
              </div>
            ))}
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const staticFallback = [
    { name: "James Mitchell", rating: 5, text: "Definitely recommend paying for a report before buying an aircraft. Saved me from a bad deal.", date: "2 days ago", verified: true },
    { name: "Robert Dawson", rating: 5, text: "Excellent — got exactly the information I needed. Fast and thorough.", date: "5 days ago", verified: true },
    { name: "Michael Torres", rating: 5, text: "Very fast and high quality work, thank you!", date: "1 week ago", verified: true },
    { name: "David K.", rating: 4, text: "Thanks to ABOS I know everything about my plane. Of course it doesn't know everything, but plenty of useful data.", date: "10 days ago", verified: true },
    { name: "Sarah Chen", rating: 5, text: "Service center photos of the aircraft? Amazing!", date: "2 weeks ago", verified: true },
  ];

  return (
    <section className="py-24 bg-secondary/30 relative">
      <div className="max-w-[1400px] mx-auto px-6 bg-secondary/50 rounded-[3rem] py-16">
        <AnimatedElement>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Customer experiences</h2>
            <p className="text-muted-foreground text-sm">See what pilots and aircraft buyers say about our reports</p>
            <div className="flex flex-col items-center justify-center mt-6">
              <div className="flex items-center gap-2 mb-1">
                 <span className="font-bold text-foreground">Google</span> <span className="text-sm font-medium">Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="font-bold text-lg text-foreground">4.8</span>
                 <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />)}</div>
                 <span className="text-muted-foreground text-xs ml-1">(2 401)</span>
              </div>
            </div>
          </div>
        </AnimatedElement>

        {/* Horizontal scrollable flex container for cards */}
        <div className="flex overflow-x-auto gap-4 pb-8 px-4 sm:px-12 snap-x snap-proximity hide-scrollbar">
          {staticFallback.map((item, index) => (
            <AnimatedElement key={index} delay={index * 80} className="snap-center shrink-0 w-[280px] sm:w-[320px]">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm flex items-center gap-1">
                       {item.name} {item.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{item.date}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(item.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#FBBC04] text-[#FBBC04]" />)}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed flex-1">{item.text}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
        
        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 mt-4">
           <div className="w-2 h-2 rounded-full bg-primary" />
           <div className="w-2 h-2 rounded-full bg-border" />
           <div className="w-2 h-2 rounded-full bg-border" />
        </div>
      </div>
      
      {/* CSS to hide scrollbar but allow scrolling */}
      <style dangerouslySetInnerHTML={{__html: `
         .hide-scrollbar::-webkit-scrollbar { display: none; }
         .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "What is an N-Number?", a: "An N-Number (or N-registration) is the unique identifier for an aircraft registered in the United States. It begins with the letter N followed by 1-5 digits and optionally 1-2 letters." },
    { q: "How much does a report cost?", a: "Basic access to the FAA Aircraft Registry is free. Premium plans are available for comprehensive historical data from NTSB and other sources." },
    { q: "How can I pay?", a: "Online payment via credit card, PayPal, or Google/Apple Pay through our secure payment gateway." },
    { q: "How long does it take to receive results?", a: "FAA registry results are available instantly. A comprehensive history report is generated within minutes." },
    { q: "How do I view my report?", a: "Your report is available online immediately after generation. A link is also sent to your email." },
    { q: "Can I dispute a report?", a: "Yes. If you suspect incorrect data in your report, contact our support team for a review." },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Frequently asked questions</h2>
        </AnimatedElement>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <AnimatedElement key={i} delay={i * 60}>
              <div className="border-b border-border/60">
                <button
                  className="w-full flex items-center justify-between py-5 text-left group"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-semibold text-foreground text-[15px] group-hover:text-primary transition-colors">{faq.q}</span>
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 transition-transform duration-300">
                     {open === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>
                {open === i && (
                  <div className="pb-6 text-muted-foreground text-sm leading-relaxed pr-10 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            </AnimatedElement>
          ))}
        </div>
        <AnimatedElement delay={200}>
          <div className="text-center mt-10">
            <Button variant="outline" className="rounded-full px-8 py-5 border-border hover:bg-muted font-semibold">
              All questions
            </Button>
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

function BottomCTASection() {
  const [nNumber, setNNumber] = useState("");
  const handleCheck = () => {
    if (nNumber.trim()) {
      window.open(`https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nNumber}`, "_blank");
    }
  };

  return (
    <section className="py-24 bg-primary text-primary-foreground text-center">
      <div className="max-w-2xl mx-auto px-6">
        <AnimatedElement>
          <h2 className="text-3xl font-bold mb-4">
            Be the first to know about our updates
          </h2>
          <p className="text-primary-foreground/70 mb-8 text-sm">Or enter an N-Number to check an aircraft right now</p>
          
          <div className="max-w-md mx-auto relative group">
            <input
               value={nNumber}
               onChange={(e) => setNNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
               placeholder="Enter N-Number..."
               className="w-full pl-6 pr-32 py-4 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm font-medium backdrop-blur-sm transition-all"
               onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />
            <button
               onClick={handleCheck}
               className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-background text-foreground rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
               Submit
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-primary-foreground/60">
             <input type="checkbox" className="rounded border-primary-foreground/30 bg-transparent" />
             <span>I agree to the processing of personal data</span>
          </div>
        </AnimatedElement>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <GlobalStyles />
      <HeroSection />
      <ChecksSection />
      <SampleReportSection />
      <AircraftTypesSection />
      <DataSourcesSection />
      <WorldMapSection />
      <HowItWorksSection />
      <ProfessionalsSection />
      <TestimonialsSection />
      <FAQSection />
      <BottomCTASection />
    </div>
  );
}