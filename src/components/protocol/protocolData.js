import { Braces, Radio, ShieldCheck, GitFork, Bot, LockKeyhole, Fingerprint, Compass, Network } from "lucide-react";

export const APS_PROTOCOLS = [
  { key: "apl", name: "APL", fullName: "ABOS Protocol Language", description: "Canonical language for portable aircraft data, actions and policy declarations.", version: "0.1", status: "Draft", rfc: "RFC-001", icon: Braces },
  { key: "api", name: "API", fullName: "Core API Protocol", description: "Versioned request and response contracts for ABOS platform capabilities.", version: "1.0", status: "Normative", rfc: "RFC-002", icon: Network },
  { key: "events", name: "Events", fullName: "Event Protocol", description: "Standard event envelopes for auditable aviation workflow interoperability.", version: "1.0", status: "Normative", rfc: "RFC-003", icon: Radio },
  { key: "ati", name: "ATI", fullName: "Transparency Protocol", description: "Normative scoring and evidence model for the Aircraft Transparency Index.", version: "2.0", status: "Normative", rfc: "RFC-004", icon: ShieldCheck },
  { key: "knowledge_graph", name: "Knowledge Graph", fullName: "Aviation Graph Protocol", description: "Shared semantics for aircraft, parties, records and relationship provenance.", version: "0.1", status: "Planned", rfc: "RFC-005", icon: GitFork },
  { key: "mcp", name: "MCP", fullName: "Model Context Protocol", description: "Governed tool and context exchange for aviation intelligence agents.", version: "0.1", status: "Draft", rfc: "RFC-006", icon: Bot },
  { key: "security", name: "Security", fullName: "Security Protocol", description: "Trust boundaries, request integrity and minimum controls across APS.", version: "1.0", status: "Normative", rfc: "RFC-007", icon: LockKeyhole },
  { key: "identity", name: "Identity", fullName: "Identity Protocol", description: "Verifiable identities for aircraft, organizations, users and authorities.", version: "0.1", status: "Draft", rfc: "RFC-008", icon: Fingerprint },
  { key: "discovery", name: "Discovery", fullName: "Capability Discovery", description: "Machine-readable discovery of compatible APS services and versions.", version: "0.1", status: "Planned", rfc: "RFC-009", icon: Compass },
];

export const RFC_STATUS = {
  draft: ["Draft", "#a7adb8"], review: ["Review", "#4e8ef7"], candidate: ["Candidate", "#a879ff"], accepted: ["Accepted", "#f5c242"],
  implemented: ["Implemented", "#62cf8f"], integrated: ["Integrated", "#5dcaa5"], archived: ["Archived", "#e24b4a"],
};