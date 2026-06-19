import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerPartner } from "@/functions/registerPartner";
import { ArrowRight, Check, Copy, Database, Shield, Zap, Globe, Activity, Plane, Server, Star, Code, ChevronDown, ExternalLink, Loader2 } from "lucide-react";

function StatStrip() {
  const stats = [
    { value: "11", label: "Data Points", icon: <Database className="w-5 h-5" /> },
    { value: "1,000+", label: "Partners", icon: <Globe className="w-5 h-5" /> },
    { value: "99.9%", label: "Uptime", icon: <Shield className="w-5 h-5" /> },
    { value: "FAA", label: "Official Data", icon: <Plane className="w-5 h-5" /> },
  ];

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className="mb-1 text-accent">{stat.icon}</div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-primary-foreground/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { icon: <Database className="w-8 h-8" />, title: "11 Data Points", desc: "FAA Registration, NTSB Accidents, ADs, SDRs, STCs, Service Bulletins, Engine DB, and more." },
    { icon: <Code className="w-8 h-8" />, title: "JSON API", desc: "Clean, structured JSON responses ready for integration into any platform or workflow." },
    { icon: <Shield className="w-8 h-8" />, title: "99.9% Uptime", desc: "Built on reliable infrastructure with redundancy and failover for mission-critical operations." },
    { icon: <Plane className="w-8 h-8" />, title: "FAA-Official Data", desc: "All data sourced directly from FAA, NTSB, and government registries — always up to date." },
    { icon: <Globe className="w-8 h-8" />, title: "White-Label Ready", desc: "Embed our reports with your branding — custom logos, colors, and domain support." },
    { icon: <Zap className="w-8 h-8" />, title: "Fast Responses", desc: "Parallel data fetching delivers complete reports in under 3 seconds on average." },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need in one API</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One endpoint, all the aircraft data your platform needs.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-accent mb-4">{f.icon}</div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "/mo",
      calls: "100 calls/day",
      features: ["All 11 data points", "JSON responses", "Standard support", "Public attribution required"],
      highlighted: false,
      cta: "Get Started Free",
      plan: "free"
    },
    {
      name: "Pro",
      price: "$99",
      period: "/mo",
      calls: "5,000 calls/day",
      features: ["All 11 data points", "JSON responses", "Priority support", "White-label reports", "Custom branding", "API usage analytics"],
      highlighted: true,
      cta: "Start Pro Trial",
      plan: "pro"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      calls: "Unlimited",
      features: ["All Pro features", "Dedicated support", "SLA guarantee", "Custom integrations", "On-premise option", "Volume discounts"],
      highlighted: false,
      cta: "Contact Sales",
      plan: "enterprise"
    },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">Start free and scale as you grow</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 border-2 transition-all duration-300 ${
                tier.highlighted
                  ? "border-accent bg-card shadow-xl scale-[1.02] relative"
                  : "border-border bg-card hover:shadow-lg"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs font-bold">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>
              <div className="text-sm font-semibold text-accent mb-6">{tier.calls}</div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.highlighted ? "default" : "outline"}
                className={`w-full ${tier.highlighted ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
                onClick={() => document.getElementById("signup-form").scrollIntoView({ behavior: "smooth" })}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SignUpForm() {
  const [form, setForm] = useState({ name: "", company: "", email: "", website: "", plan: "free", useCase: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await registerPartner({
        name: form.name,
        company: form.company,
        email: form.email,
        website: form.website,
        plan: form.plan,
        use_case: form.useCase,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    if (result?.api_key) {
      navigator.clipboard.writeText(result.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="signup-form" className="py-20 bg-background">
      <div className="max-w-lg mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Get Your API Key</h2>
          <p className="text-muted-foreground">Fill out the form below and start integrating in minutes</p>
        </motion.div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-card border border-border shadow-lg text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Your API Key is Ready!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Plan: <span className="font-semibold text-foreground capitalize">{result.plan}</span> — {result.daily_limit?.toLocaleString()} calls/day
            </p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 bg-muted rounded-lg px-4 py-3 text-xs font-mono text-foreground break-all text-left">
                {result.api_key}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey} className="flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save this key — you won't see it again. See the API docs below to get started.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl bg-card border border-border shadow-sm">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="AeroTech Inc." className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@aerotech.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://aerotech.com" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro ($99/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Use Case</Label>
                <Select value={form.useCase} onValueChange={(v) => setForm({ ...form, useCase: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aircraft_dealer">Aircraft Dealer</SelectItem>
                    <SelectItem value="flight_school">Flight School</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-bold" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <>Get Your API Key <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function ApiDocs() {
  const [activeTab, setActiveTab] = useState("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const snippets = {
    curl: `curl -X POST https://api.anyair.com/v1/report \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"nNumber": "N12345"}'`,
    javascript: `const response = await fetch('https://api.anyair.com/v1/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({ nNumber: 'N12345' })
});

const report = await response.json();
console.log(report.sections.getFAARegistration.data.manufacturer);`,
    python: `import requests

response = requests.post(
    "https://api.anyair.com/v1/report",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "YOUR_API_KEY"
    },
    json={"nNumber": "N12345"}
)

report = response.json()
print(report["sections"]["getFAARegistration"]["data"]["manufacturer"])`
  };

  const exampleResponse = `{
  "n_number": "N12345",
  "generated_at": "2026-06-18T12:00:00Z",
  "partner": { "name": "AeroTech", "plan": "pro" },
  "sections": {
    "getFAARegistration": {
      "source": "faa_registry",
      "status": "success",
      "data": {
        "n_number": "N12345",
        "manufacturer": "Cessna",
        "model": "172S",
        "year": "2023",
        "owner_name": "Skyward Aviation LLC",
        "status": "Valid"
      }
    },
    "getNTSBAccidents": {
      "source": "ntsb_accidents",
      "status": "success",
      "data": { "total_records": 0, "accidents": [] }
    }
  }
}`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">API Documentation</h2>
          <p className="text-muted-foreground text-lg">One endpoint. Complete aircraft history.</p>
        </motion.div>

        {/* Endpoint card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-card border border-border overflow-hidden mb-10"
        >
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">POST</div>
            <code className="text-sm font-mono text-foreground">/v1/report</code>
          </div>
          <div className="p-6">
            <h4 className="font-semibold text-foreground mb-3">Request Body</h4>
            <div className="bg-muted rounded-lg p-4 text-sm font-mono text-foreground/80 mb-6">
              {"{ \"nNumber\": \"N12345\" }"}
            </div>
            <h4 className="font-semibold text-foreground mb-3">Headers</h4>
            <div className="bg-muted rounded-lg p-4 text-sm font-mono text-foreground/80">
              <div>Content-Type: application/json</div>
              <div>X-API-Key: YOUR_API_KEY</div>
            </div>
          </div>
        </motion.div>

        {/* Code snippets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-card border border-border overflow-hidden mb-10"
        >
          <div className="flex border-b border-border">
            {["curl", "javascript", "python"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-accent border-b-2 border-accent bg-accent/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "curl" ? "cURL" : tab === "javascript" ? "JavaScript" : "Python"}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={copySnippet} className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              {copiedSnippet ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedSnippet ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="p-6 text-sm font-mono text-foreground/80 overflow-x-auto bg-muted/30 whitespace-pre">
            {snippets[activeTab]}
          </pre>
        </motion.div>

        {/* Example response */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold text-foreground">Example Response</span>
            <button
              onClick={() => { navigator.clipboard.writeText(exampleResponse); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="p-6 text-xs font-mono text-foreground/80 overflow-x-auto max-h-96 overflow-y-auto">
            {exampleResponse}
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

export default function APIPortal() {
  return (
    <div className="bg-background min-h-screen pt-16">
      {/* Hero */}
      <section className="relative bg-[#EBF4FF] py-24 overflow-hidden">
        <div className="absolute top-10 right-[5%] w-72 h-72 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 left-[5%] w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-5 tracking-tight">
              Power your aviation platform with <span className="text-accent">ANYAIR</span> data
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Access FAA registration, NTSB accidents, airworthiness directives, STCs, service bulletins, and more — all through a single API endpoint.
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base px-8 py-6 rounded-full"
              onClick={() => document.getElementById("signup-form").scrollIntoView({ behavior: "smooth" })}
            >
              Get Your API Key <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <StatStrip />
      <FeaturesGrid />
      <Pricing />
      <SignUpForm />
      <ApiDocs />
    </div>
  );
}