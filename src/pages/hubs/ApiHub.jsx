import {
  Code, Store, Plug, Bot, GitBranch, Sparkles, Wallet, Download,
} from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const ApiLanding = lazyPage(() => import("@/pages/ApiLanding"));
const Marketplace = lazyPage(() => import("@/pages/Marketplace"));
const Developers = lazyPage(() => import("@/pages/Developers"));
const IntegrationKit = lazyPage(() => import("@/pages/IntegrationKit"));
const AgentConnect = lazyPage(() => import("@/pages/AgentConnect"));
const Workflows = lazyPage(() => import("@/pages/Workflows"));
const Skills = lazyPage(() => import("@/pages/Skills"));
const DeveloperEarnings = lazyPage(() => import("@/pages/DeveloperEarnings"));
const ApiInstallerRequest = lazyPage(() => import("@/pages/ApiInstallerRequest"));

const TABS = [
  { key: "core-api", label: "Overview", icon: Code, Component: ApiLanding },
  { key: "installer", label: "Self-Hosted Installer", icon: Download, Component: ApiInstallerRequest },
  { key: "marketplace", label: "Marketplace", icon: Store, Component: Marketplace },
  { key: "developers", label: "Developer Portal", icon: Wallet, Component: Developers },
  { key: "integration-kit", label: "Integration Kit", icon: Plug, Component: IntegrationKit },
  { key: "agent-connect", label: "Agent Connect", icon: Bot, Component: AgentConnect },
  { key: "workflows", label: "Workflows", icon: GitBranch, Component: Workflows },
  { key: "skills", label: "Skills", icon: Sparkles, Component: Skills },
  { key: "earnings", label: "Earnings", icon: Wallet, Component: DeveloperEarnings },
];

export default function ApiHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <HubPageHeader
        icon={Code}
        eyebrow="Developer API"
        title="API, MCP & Developer Hub"
        subtitle="White-label licensing, MCP server, SDK references, self-hosted installer, integration kit, agent connections, workflow management, and the developer marketplace — everything builders need. Full endpoint docs and key management live in the Developer Portal tab once you're signed in."
        tabCount={TABS.length}
      />
      <HubTabs tabs={TABS} defaultTab="core-api" />
    </div>
  );
}
