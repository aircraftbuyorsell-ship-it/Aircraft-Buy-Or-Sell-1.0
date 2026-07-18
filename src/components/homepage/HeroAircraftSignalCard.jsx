import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

export default function HeroAircraftSignalCard({ aircraft }) {
  if (!aircraft) return null;

  return (
    <>
      {/* Floating signal card attached to globe */}
      <div
        className="
          absolute right-[26%] top-[30%] z-30 hidden
          items-center gap-1.5 rounded-[5px]
          border border-black/[0.08] bg-white/90
          px-4 py-2.5 text-[12px] text-[#555]
          shadow-[0_10px_30px_rgba(20,24,32,0.12)]
          backdrop-blur-xl
          lg:flex
          xl:right-[28%] xl:top-[32%]
        "
      >
        <strong className="font-semibold text-[#181818]">{aircraft.registration}</strong>
        <span className="text-black/35">·</span>
        <span>{getAircraftStatusLabel(aircraft)}</span>
      </div>

      {/* Pulse behind floating card */}
      <div
        aria-hidden="true"
        className="
          absolute right-[38%] top-[36%] z-20 hidden
          h-4 w-4 rounded-full border border-emerald-400/80
          bg-emerald-300/70 shadow-[0_0_0_8px_rgba(52,211,153,0.12),0_0_28px_rgba(52,211,153,0.75)]
          lg:block
          xl:right-[40%] xl:top-[38%]
        "
      />
    </>
  );
}