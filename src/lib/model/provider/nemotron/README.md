# St. Elmo M_1.0 — NVIDIA Nemotron adapter

ABOS keeps `ABOS St. Elmo M_1.0` as the stable model identity. NVIDIA Nemotron 3 Super is the current reasoning backend implementation.

## Hosted NVIDIA NIM

The Base44 `stElmoReasoning` function calls the NVIDIA-compatible chat completions endpoint with `NVIDIA_API_KEY`. The credential stays server-side.

Environment variables:

- `NVIDIA_API_KEY` — required secret
- `NVIDIA_NIM_BASE_URL` — optional override, defaults to `https://integrate.api.nvidia.com/v1/chat/completions`

## Self-hosted vLLM

`super_v3_reasoning_parser.py` is the official NVIDIA parser retrieved from the Nemotron 3 Super Hugging Face repository. It registers the `super_v3` parser for vLLM and handles thinking-disabled / truncated reasoning cases.

The parser is intentionally isolated under the provider adapter so the St. Elmo identity is not coupled to NVIDIA. If the reasoning backend changes later, replace the provider adapter rather than changing the ABOS model identity.

## Authority boundary

Nemotron may plan and synthesize. It must not invent or authoritatively calculate ATI, OMVM, verification, ownership, registry, service, pricing, or transaction state. Those remain ABOS domain-engine outputs backed by evidence and authorization.
