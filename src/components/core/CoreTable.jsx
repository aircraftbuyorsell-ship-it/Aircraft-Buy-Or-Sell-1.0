import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

/**
 * CoreTable — Core Platform data table primitive.
 * Pass `headers` (string[]) and `rows` (array of arrays/cells).
 */
export default function CoreTable({ headers = [], rows = [], className = "" }) {
  return (
    <div
      className={`rounded-xl border border-border/60 overflow-hidden bg-card ${className}`}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-border/60">
            {headers.map((h) => (
              <TableHead
                key={h}
                className="text-muted-foreground font-semibold uppercase tracking-wide text-xs"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="border-border/40">
              {row.map((cell, j) => (
                <TableCell key={j} className="text-foreground/90">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}