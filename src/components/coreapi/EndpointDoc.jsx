export default function EndpointDoc({ endpoint, scope, description, request, response }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <code className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.28)", color: "#f5c242" }}>
          {endpoint}
        </code>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
          {scope}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>{description}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] m-0 mb-1.5" style={{ color: "rgba(255,255,255,0.30)" }}>Request</p>
          <pre className="text-[11px] leading-relaxed p-3 rounded-xl overflow-x-auto m-0"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}>
            {request}
          </pre>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] m-0 mb-1.5" style={{ color: "rgba(255,255,255,0.30)" }}>Response</p>
          <pre className="text-[11px] leading-relaxed p-3 rounded-xl overflow-x-auto m-0"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(93,202,165,0.12)", color: "#5dcaa5" }}>
            {response}
          </pre>
        </div>
      </div>
    </div>
  );
}