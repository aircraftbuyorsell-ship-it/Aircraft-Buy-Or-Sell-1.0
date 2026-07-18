export default function LightModeTransition() {
  return (
    <section className="light-return-transition relative min-h-[380px] overflow-hidden">
      <div className="homepage-grid-layer" />
      <div className="relative z-10 mx-auto flex min-h-[380px] max-w-[820px] flex-col items-center justify-center px-5 py-20 text-center">
        <p className="text-xl font-semibold tracking-[-0.02em] text-[#d8dce2] sm:text-3xl" style={{ textShadow: "0 1px 16px rgba(11,17,26,0.6)" }}>
          One Intelligence Layer.<br />Multiple Interfaces.
        </p>
        <p className="mt-4 max-w-md text-[13px] leading-6 text-[#69707c]">
          Intelligence powers the public website, professional workspace, APIs, enterprise systems and authorized automation.
        </p>
      </div>
    </section>
  );
}