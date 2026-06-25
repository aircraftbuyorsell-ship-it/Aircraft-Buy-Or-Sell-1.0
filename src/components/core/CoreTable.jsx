import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

/**
 * CoreTable — Privacy Policy / Legal Ink style.
 * Translucent surface, thin borders, subtle header tint.
 */
export default function CoreTable({ headers = [], rows = [], className = "", style }) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {headers.map((h) => (
              <TableHead
                key={h}
                className="text-white/35 font-semibold uppercase tracking-[0.08em] text-[10px]"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="border-white/8">
              {row.map((cell, j) => (
                <TableCell key={j} className="text-white/80">
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