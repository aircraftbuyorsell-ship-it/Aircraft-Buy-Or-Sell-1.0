import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Globe, ChevronDown, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Aircraft Check", path: "/" },
    { name: "For Partners", path: "/api-portal" },
    { name: "How It Works", path: "#" },
    { name: "FAQ", path: "#" },
    { name: "Contact", path: "#" },
    { name: "About", path: "#" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-background"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center group-hover:bg-accent transition-colors">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span
              className="font-bold text-2xl text-foreground tracking-tight"
              style={{ fontFamily: "'hostgrotesk', system-ui, sans-serif" }}
            >
              ANY<span className="text-accent">AIR</span>.ONLINE
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className={`text-[15px] font-medium transition-colors hover:text-accent ${
                  location.pathname === link.path || (link.path === "/" && location.pathname === "")
                    ? "text-accent"
                    : "text-foreground/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side (Language) */}
          <div className="hidden sm:flex items-center gap-2 text-foreground/80 hover:text-foreground cursor-pointer text-sm font-medium">
            <Globe className="w-4 h-4" />
            <span>EN</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border w-72">
              <div className="flex flex-col gap-6 mt-8">
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Plane className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    ANY<span className="text-accent">AIR</span>.ONLINE
                  </span>
                </Link>

                <div className="flex flex-col gap-2">
                  {navLinks.map((link, i) => (
                    <Link
                      key={i}
                      to={link.path}
                      className="px-4 py-3 rounded-xl text-foreground/80 hover:text-accent hover:bg-muted transition-colors text-base font-medium"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-auto border-t border-border pt-4 flex items-center gap-2 text-foreground/80 px-4">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">English (EN)</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}