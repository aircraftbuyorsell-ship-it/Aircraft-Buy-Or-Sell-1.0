import CommunityHero from "@/components/community/CommunityHero";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import CommunityStats from "@/components/community/CommunityStats";
import CommunityInsights from "@/components/community/CommunityInsights";
import { C } from "@/theme/community";

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
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-8" style={{ background: C.bg }}>
      {/* Ambient gold/blue glows */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-[-12%] top-[-12%] h-96 w-96 rounded-full blur-3xl" style={{ background: `${C.gold}22` }} />
        <div className="absolute right-[-10%] top-32 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: `${C.blue}14` }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] space-y-5">
        <CommunityHero />
        <CommunityStats />
        <CommunityInsights />

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