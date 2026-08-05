import HomepageHeader from "@/components/homepage/HomepageHeader";
import NotificationStack from "@/components/notifications/NotificationStack";
import BuySellHero from "@/components/entry/BuySellHero";

export default function Dashboard() {
  return <div className="min-h-screen bg-background text-foreground"><HomepageHeader /><NotificationStack /><BuySellHero /></div>;
}