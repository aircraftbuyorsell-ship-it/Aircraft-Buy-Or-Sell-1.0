import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Mobile-first bottom-sheet select.
 * On mobile: opens a bottom sheet with 44px+ touch rows.
 * On desktop: renders the same interaction as a dropdown (still bottom-sheet-styled for consistency).
 *
 * Props:
 *  - value: current value
 *  - onChange: (value) => void
 *  - options: [{ value, label }]
 *  - placeholder: string
 *  - className: extra classes for the trigger
 */
export default function BottomSheetSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  className = "",
  label,
}) {
  const [open, setOpen] = useState(false);
  const backdropRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] hover:border-[#0B2D5B] transition-colors ${className}`}
      >
        <span className={`truncate ${selected ? "text-[#1A1814]" : "text-[#AAA49C]"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#6B6560] shrink-0" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            ref={backdropRef}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-[60] animate-in fade-in duration-200"
          />

          {/* Sheet */}
          <div
            className="fixed left-0 right-0 bottom-0 z-[61] bg-white rounded-t-2xl shadow-2xl
                       max-h-[75vh] flex flex-col safe-bottom animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-black/[0.06]">
              <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">
                {label || placeholder}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-[#6B6560] hover:text-[#1A1814] touch-target-compact"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {options.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left border-b border-black/[0.04] last:border-0 transition-colors ${
                      isSelected ? "bg-[rgba(11,45,91,0.06)]" : "hover:bg-[#F7F4EF] active:bg-[#F0EDE6]"
                    }`}
                  >
                    <span className={`text-[15px] ${isSelected ? "font-black text-[#0B2D5B]" : "text-[#1A1814] font-medium"}`}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-[#0B2D5B] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}