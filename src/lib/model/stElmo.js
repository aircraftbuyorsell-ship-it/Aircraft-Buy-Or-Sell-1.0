import { ST_ELMO_MODEL } from "./provider/nemotron/config";

/** Stable ABOS model identity. Provider/model can change without changing product identity. */
export const ABOS_ST_ELMO = Object.freeze({
  id: "abos-st-elmo",
  identity: ST_ELMO_MODEL.identity,
  version: ST_ELMO_MODEL.version,
  reasoning_backend: ST_ELMO_MODEL.model,
  architecture: "model-agnostic",
  authority_boundary: {
    reasoning: ["plan", "reason", "select_capability", "interpret_evidence", "synthesize"],
    abos_engines: ["verify", "calculate_ati", "calculate_omvm", "persist", "score", "authorize"],
  },
});
