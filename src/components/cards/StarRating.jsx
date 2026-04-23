import { Star } from "lucide-react";

/** Display-only or interactive 1-5 star rating. */
export default function StarRating({ value = 0, onChange, size = "md", interactive = false }) {
  const sizes = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-6 h-6" };
  const cls = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= Math.round(value);
        const StarBtn = interactive ? "button" : "span";
        return (
          <StarBtn
            key={n}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={interactive ? "hover:scale-110 transition-transform" : ""}
          >
            <Star
              className={`${cls} ${active ? "fill-[#E8A83A] text-[#E8A83A]" : "text-black/15"}`}
              strokeWidth={1.5}
            />
          </StarBtn>
        );
      })}
    </div>
  );
}