import CommunityHero from "@/components/community/CommunityHero";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import CommunityStats from "@/components/community/CommunityStats";

const POSTS = [
  {
    tag: "For Sale",
    title: "Clean Cessna 172 wanted by first-time owner",
    body: "Members can share clean ownership history, avionics notes, annual status, and direct seller leads before a public listing gets crowded.",
    meta: "Buyer lead · SEP trainer",
  },
  {
    tag: "Wanted",
    title: "Piper Cherokee / Archer opportunities",
    body: "A dedicated thread style for matching budget, mission, region, and engine-time preferences with owners considering a quiet sale.",
    meta: "Off-market match",
  },
  {
    tag: "Advice",
    title: "Pre-buy checklist and logbook clarity",
    body: "Community members can ask for inspection tips, document expectations, title concerns, and market sanity checks before committing funds.",
    meta: "Owner knowledge",
  },
];

export default function Community() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EF] px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-12%] top-[-12%] h-96 w-96 rounded-full bg-[#E8A83A]/18 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-[28rem] w-[28rem] rounded-full bg-[#0B2D5B]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] space-y-5">
        <CommunityHero />
        <CommunityStats />

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {POSTS.map((post) => (
              <CommunityPostCard key={post.title} {...post} />
            ))}
          </section>
          <CommunitySidebar />
        </div>
      </div>
    </div>
  );
}