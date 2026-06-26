import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import NRegLookup from "@/components/dashboard/NRegLookup";

export default function HeroSection({ listings = [], atiCards = [], activeAti = [] }) {
  const counters = [
    { value: listings.length, label: "Active Listings" },
    { value: atiCards.length, label: "ATI Passports" },
    { value: activeAti.length, label: "Active ATI" },
  ];
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <SkyBossGlobe className="w-full h-full" listings={listings} />
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 32px 0",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
          flex: 1,
        }}
      >
        <div style={{ maxWidth: 520, position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: "-24px -48px -24px -48px",
            zIndex: -1,
            background: "linear-gradient(to right, rgba(4,6,10,0.45) 0%, rgba(4,6,10,0.20) 70%, transparent 100%)",
            borderRadius: "20px",
            pointerEvents: "none",
          }} />
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#D4A017",
              marginBottom: 16,
            }}
          >
            Global Aircraft Identity & Intelligence
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 56px)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              color: "#fff",
              marginBottom: 20,
            }}
          >
            Aircraft Intelligence,
            <br />
            Verified by Data.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              maxWidth: 440,
            }}
          >
            The operating system for aircraft transactions. Identity, valuation,
            and market intelligence — trusted by dealers, brokers, and owners
            worldwide.
          </p>
        </div>
        <div style={{ width: "100%", maxWidth: 360, flexShrink: 0 }}>
          <NRegLookup />
        </div>
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px 40px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: "-12px -24px -12px -24px",
            zIndex: -1,
            background: "linear-gradient(to right, rgba(4,6,10,0.40) 0%, transparent 80%)",
            borderRadius: "12px",
            pointerEvents: "none",
          }} />
          {counters.map((c) => (
            <div key={c.label}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  letterSpacing: "-0.04em",
                  color: "#D4A017",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 4,
                }}
              >
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}