import { Link } from "react-router-dom";
import { Plane, Youtube, Facebook, Instagram, Linkedin, Twitter, Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter strip */}
      <div className="border-b border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-primary-foreground mb-1">
                Be the first to know about updates
              </h3>
              <p className="text-primary-foreground/60 text-sm">FAA updates, buyer tips, and database enhancements</p>
            </div>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-xl text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent text-sm"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-primary-foreground" style={{ fontFamily: "'hostgrotesk', system-ui, sans-serif" }}>
                ANY<span className="text-accent">AIR</span>
              </span>
            </Link>
            <p className="text-primary-foreground/60 text-sm leading-relaxed mb-5">
              The largest database of N-registered aircraft. Data directly from FAA, NTSB, and 50+ other sources.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2.5">
            <li><Link to="/" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Aircraft Check</Link></li>
            <li><Link to="/FAQ" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">FAQ</Link></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">For Business</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Contact</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">About Us</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Careers</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Press Releases</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5">
            <li><a href="https://registry.faa.gov/AircraftInquiry/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors flex items-center gap-1">FAA Registry <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="https://www.ntsb.gov/Pages/AviationQueryV2.aspx" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors flex items-center gap-1">NTSB Accidents <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Ownership Check</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Lien Search</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Maintenance Records</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Airworthiness Directives</a></li>
            <li><Link to="/api-portal" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">API for Partners</Link></li>
            </ul>
          </div>

          {/* External Resources */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5">
            <li><a href="https://www.faa.gov/aircraft" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors flex items-center gap-1">FAA Aircraft <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="https://www.ntsb.gov/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors flex items-center gap-1">NTSB <ExternalLink className="w-3 h-3" /></a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">How to Read an N-Number</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">Aircraft Buyer's Guide</a></li>
            <li><a href="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">US Aviation Law</a></li>
            <li>
              <a href="mailto:support@anyair.com" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />support@anyair.com
              </a>
            </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <span>© 2026 ANYAIR — N-Number Lookup powered by FAA data</span>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-primary-foreground transition-colors">Legal Information</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Cookie Settings</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Complaints</a>
          </div>
        </div>
      </div>
    </footer>
  );
}