import { CheckSquare, Square } from "lucide-react";

export default function SelectAllCheckbox({ filtered, selectedIds, onSelectAll, onClear }) {
  const allSelected = selectedIds.length === filtered.length && filtered.length > 0;
  return (
    <button
      onClick={allSelected ? onClear : onSelectAll}
      className="flex items-center gap-1.5 text-[#f5c242] hover:text-[#fdd05a] transition-colors"
      title={allSelected ? "Deselect all" : "Select all"}>

      {allSelected ?
      <CheckSquare className="w-4 h-4" /> :
      <Square className="w-4 h-4 text-[rgba(255,255,255,0.3)]" />}
    </button>);
}