import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * CoreModal — Core Platform modal primitive (wraps shadcn Dialog).
 * Props: open, onOpenChange, title, description, footer.
 */
export default function CoreModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card border-border/60 rounded-xl ${className}`}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-foreground">{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-muted-foreground">
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