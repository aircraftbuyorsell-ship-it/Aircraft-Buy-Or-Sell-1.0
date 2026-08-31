import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * CoreModal — Privacy Policy / Legal Ink style.
 * Translucent dark surface, thin border, 12px radius.
 */
export default function CoreModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "",
  style,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`rounded-xl ${className}`}
        style={{
          background: "rgba(13,17,23,0.95)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.90)",
          ...style,
        }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-white/90">{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-white/50">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}