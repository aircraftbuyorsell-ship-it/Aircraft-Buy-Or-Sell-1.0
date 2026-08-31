/** ABOS Intelligence — empty state with optional action. */
export default function EmptyState({ icon: Icon, title, sub, actionLabel, onAction }) {
  return (
    <div className="glass-card text-center py-14 px-6">
      {Icon && <Icon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />}
      <p className="text-sm font-bold">{title}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {actionLabel && (
        <button onClick={onAction} className="text-gold-official text-sm font-bold mt-3 hover:underline cursor-pointer">
          {actionLabel}
        </button>
      )}
    </div>
  );
}