import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";

export default function AdvisorHero({ query, setQuery, onSubmit }) {
  return (
    <section className="advisor-hero">
      <HeroGlobe />
      <div className="advisor-hero-shade" />
      <div className="advisor-hero-content">
        <nav className="advisor-anchor-nav" aria-label="Advisor page sections">
          <a href="#trust">About Us</a><a href="#how-it-works">How It Works</a>
          <a href="#faq">FAQ</a><Link to="/my-account">User Account</Link>
        </nav>
        <span className="advisor-kicker"><i /> Global aircraft intelligence</span>
        <h1>Know the aircraft.<br />Before you trust the deal.</h1>
        <p>One registration unlocks identity, history, compliance, market evidence and a decision-ready report.</p>
        <form id="tail-search" onSubmit={onSubmit}>
          <div id="tail-search-shell"><div id="tail-search-field"><Search id="tail-search-leading" />
            <input id="tail-search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter aircraft registration" aria-label="Aircraft registration" autoComplete="off" />
          </div><button id="tail-search-submit" type="submit" disabled={!query.trim()}><span>Check aircraft</span><ArrowRight /></button></div>
        </form>
        <div className="advisor-hero-proof"><span>FAA & global registries</span><span>Real aircraft photography</span><span>Private evidence handling</span></div>
      </div>
    </section>
  );
}