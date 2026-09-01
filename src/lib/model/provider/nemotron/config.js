/**
 * ABOS St. Elmo M_1.0 — model-agnostic reasoning backend configuration.
 * Nemotron is an implementation detail; St. Elmo remains the ABOS model identity.
 */
export const ST_ELMO_MODEL = Object.freeze({
  identity: "ABOS St. Elmo",
  version: "M_1.0",
  backend: "nvidia",
  model: "nvidia/nemotron-3-super-120b-a12b",
  reasoningParser: "super_v3",
  capabilities: ["reasoning", "planning", "tool_use", "rag", "long_context"],
  authority: "abos-domain-engines",
});

export const ST_ELMO_ENV = Object.freeze({
  apiKey: "NVIDIA_API_KEY",
  baseUrl: "NVIDIA_NIM_BASE_URL",
});
