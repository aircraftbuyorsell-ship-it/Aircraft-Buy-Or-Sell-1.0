/**
 * ABOS Intelligence — action row.
 * actions: [{ label, icon: Icon, onClick, primary?: bool, disabled?: bool }]
 */
export default function ActionBar({ actions = [], className = "" }) {
  if (!actions.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick} disabled={a.disabled}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-default
            ${a.primary
              ? "bg-gold-official text-white hover:opacity-90"
              : "border border-gold-official/40 text-gold-official hover:bg-gold-bg"}`}>
          {a.icon && <a.icon className="w-4 h-4" />} {a.label}
        </button>
      ))}
    </div>
  );
}