import { ST_ELMO_MODEL } from "./config";

/**
 * Model adapter contract for St. Elmo M_1.0.
 * The browser never receives the NVIDIA credential; calls go through the
 * authenticated Base44 reasoning function.
 */
export function buildStElmoRequest({ messages, tools = [], temperature = 0.1, maxTokens = 1200 } = {}) {
  return {
    identity: ST_ELMO_MODEL.identity,
    version: ST_ELMO_MODEL.version,
    backend: ST_ELMO_MODEL.backend,
    model: ST_ELMO_MODEL.model,
    reasoning_parser: ST_ELMO_MODEL.reasoningParser,
    messages,
    tools,
    temperature,
    max_tokens: maxTokens,
  };
}

export function isStElmoResponse(value) {
  return Boolean(value && value.identity === ST_ELMO_MODEL.identity && value.version === ST_ELMO_MODEL.version);
}
