import { Link } from "react-router-dom";

export default function SidebarLogo() {
  return (
    <Link to="/" style={{ display: "block", textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "4px" }}>
        <img 
          src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/ee6ddaac8_generated_image.png" 
          alt="ABOS Logo" 
          style={{ width: "32px", height: "32px", objectFit: "contain" }}
        />
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", color: "inherit" }}>ABOS</div>
          <div style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", fontWeight: 600, marginTop: "1px" }}>
            Marketspace
          </div>
        </div>
      </div>
      
      {/* Dark mode adjustments */}
      <style>{`
        .dark [class*="SidebarLogo"] div {
          color: #f8f8fa;
        }
      `}</style>
    </Link>
  );
}