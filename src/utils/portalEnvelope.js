/**
 * Unwraps a tenantPortal response.
 *
 * Two layers are easy to confuse, and every original caller got it wrong:
 *   - `base44.functions.invoke()` resolves to an axios response, so the JSON
 *     body is `response.data` — `response.status` is the HTTP code (200).
 *   - tenantPortal wraps its own payload again as `{ status, data }`.
 *
 * Comparing `response.status` to the string "success" therefore compares 200 to
 * "success" and fails unconditionally, which is why the Partner Portal always
 * rendered its error card.
 */
export function unwrapPortalResponse(response) {
  const body = response?.data;
  if (body?.status !== "success") {
    throw new Error(body?.error?.message || "Unable to reach the Partner Portal.");
  }
  return body.data;
}
