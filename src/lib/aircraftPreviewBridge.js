import { base44 } from "@/api/base44Client";
import { lookupAircraft, normalizeReg } from "@/lib/aircraftLookup";

const BRIDGE_FLAG = "__abosAircraftPreviewBridge";

/**
 * Keeps the existing Aircraft Advisor UI working when the legacy Base44
 * aircraftPreview function is unavailable/stale. The Advisor's UI still
 * calls `aircraftPreview`; this bridge resolves that call through the same
 * shared multi-source lookup used elsewhere in ABOS.
 */
export function installAircraftPreviewBridge() {
  const functions = base44?.functions;
  if (!functions?.invoke || functions[BRIDGE_FLAG]) return;

  const originalInvoke = functions.invoke.bind(functions);

  functions.invoke = async (name, payload) => {
    if (name !== "aircraftPreview") return originalInvoke(name, payload);

    const registration = normalizeReg(payload?.registration || payload?.query);
    if (!registration) {
      return {
        data: {
          found: false,
          registration: "",
          evidence: {},
        },
      };
    }

    try {
      const result = await lookupAircraft(registration);
      if (result?.found && result?.aircraft) {
        return {
          data: {
            found: true,
            registration,
            aircraft: result.aircraft,
            evidence: {
              registry: true,
              digital_twin: Boolean(result.source === "public_faa"),
              marketplace: Boolean(result.listing),
              activity_metadata: false,
              adsbdb: false,
            },
            searchedAt: new Date().toISOString(),
          },
        };
      }

      return {
        data: {
          found: false,
          registration,
          evidence: {
            registry: false,
            digital_twin: false,
            marketplace: false,
            activity_metadata: false,
            adsbdb: false,
          },
          source_statuses: result?.source_statuses || [],
        },
      };
    } catch (_) {
      // The Advisor must not turn an unavailable source into a red 404/error
      // banner. Unknown source coverage is a valid free-preview state.
      return {
        data: {
          found: false,
          registration,
          evidence: {
            registry: false,
            digital_twin: false,
            marketplace: false,
            activity_metadata: false,
            adsbdb: false,
          },
        },
      };
    }
  };

  functions[BRIDGE_FLAG] = true;
}
