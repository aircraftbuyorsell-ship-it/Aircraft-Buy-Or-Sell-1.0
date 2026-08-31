import { useState } from "react";
import { X, Download, FileText, Shield } from "lucide-react";
import { jsPDF } from "jspdf";
import { buildContractText, calcFinderFee, formatMoney } from "@/lib/escrow";

export default function HustleContractModal({ tx, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const text = buildContractText(tx);
  const { fee, net } = calcFinderFee(tx.sale_amount, tx.finders_fee_pct);

  const handleDownloadPDF = () => {
    setDownloading(true);
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, 20);
    doc.save(`hustle-contract-${tx.id || "draft"}.pdf`);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0B2D5B] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1814] uppercase">Hustle Contract</h2>
              <p className="text-[11px] text-[#AAA49C]">Transparent finder's-fee agreement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key figures */}
        <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-black/[0.07] bg-[#F7F4EF]">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Sale</p>
            <p className="text-lg font-black text-[#1A1814]">{formatMoney(tx.sale_amount, tx.currency)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Finder's Fee ({tx.finders_fee_pct || 0}%)</p>
            <p className="text-lg font-black text-[#E8A83A]">{formatMoney(fee, tx.currency)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Seller Net</p>
            <p className="text-lg font-black text-[#0F7A56]">{formatMoney(net, tx.currency)}</p>
          </div>
        </div>

        {/* Contract text */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="text-[11px] text-[#1A1814] font-mono whitespace-pre-wrap leading-relaxed">
            {text}
          </pre>

          <div style={{
            marginTop: "24px",
            paddingTop: "12px",
            borderTop: "0.5px solid rgba(0,0,0,0.10)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px",
          }}>
            <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.40)", letterSpacing: "0.04em" }}>
              ABOS HustlContract™ · Version 1.0 · June 2026
            </span>
            <span style={{ fontSize: "10px", color: "rgba(0,0,0,0.40)", letterSpacing: "0.04em" }}>
              Governed by Czech law · Prague jurisdiction
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#0B2D5B]">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-semibold">Locked terms · Transparent for all parties</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#6B6560] hover:border-[#0B2D5B] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}