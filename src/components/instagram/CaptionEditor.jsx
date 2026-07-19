import { useState, useEffect } from "react";

export default function CaptionEditor({ value, onChange, disabled }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Caption</label>
        <span className={`text-[9px] ${value.length > 2200 ? "text-red-400" : "text-white/30"}`}>
          {value.length}/2200
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2200))}
        disabled={disabled}
        rows={6}
        placeholder="Caption for your Instagram post..."
        className="w-full px-3 py-2.5 rounded-lg text-xs outline-none resize-none disabled:opacity-50"
        style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
      />
    </div>
  );
}