import { Link } from "react-router-dom";

const PRIMARY = [
  ["Home", "/"], ["Marketspace", "/marketspace"], ["Intelligence", "/intelligence"],
  ["Verify", "/verify"], ["API", "/api"], ["Pricing", "/pricing"],
];

const TRUST = [
  ["About Us", "/about"], ["How It Works", "/how-it-works"], ["FAQ", "/faq"],
  ["Privacy", "/privacy-policy"], ["Terms", "/terms-of-service"], ["Cookies", "/cookie-policy"],
];

export default function PublicFooterLinks() {
  return (
    <nav aria-label="Footer navigation" className="grid gap-7 sm:grid-cols-2">
      <section>
        <h2 className="footer-map-heading text-sm font-bold">Explore ABOS</h2>
        <div className="mt-4 grid grid-cols-2 gap-y-2">{PRIMARY.map(([label, path]) => <Link key={path} to={path} className="footer-map-link">{label}</Link>)}</div>
      </section>
      <section>
        <h2 className="footer-map-heading text-sm font-bold">Company & Trust</h2>
        <div className="mt-4 grid grid-cols-2 gap-y-2">{TRUST.map(([label, path]) => <Link key={path} to={path} className="footer-map-link">{label}</Link>)}</div>
      </section>
    </nav>
  );
}