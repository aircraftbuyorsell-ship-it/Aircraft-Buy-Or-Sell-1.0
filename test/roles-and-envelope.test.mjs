import test from "node:test";
import assert from "node:assert/strict";

import { isAdminRole, ADMIN_ROLES } from "../src/utils/roles.js";
import { unwrapPortalResponse } from "../src/utils/portalEnvelope.js";

test("super_admin has every admin capability", () => {
  assert.equal(isAdminRole({ role: "super_admin" }), true);
  assert.equal(isAdminRole({ role: "admin" }), true);
});

test("ordinary and missing roles are not admin", () => {
  assert.equal(isAdminRole({ role: "user" }), false);
  assert.equal(isAdminRole({ role: "broker" }), false);
  assert.equal(isAdminRole({}), false);
  assert.equal(isAdminRole(null), false);
  assert.equal(isAdminRole(undefined), false);
});

test("the admin role set cannot be mutated by a caller", () => {
  assert.ok(Object.isFrozen(ADMIN_ROLES));
  assert.deepEqual([...ADMIN_ROLES].sort(), ["admin", "super_admin"]);
});

test("unwraps the payload out of both envelope layers", () => {
  // axios response -> body -> tenantPortal envelope -> payload
  const response = { status: 200, data: { status: "success", data: { tenant: { tenant_id: "skydeals" } } } };
  assert.deepEqual(unwrapPortalResponse(response), { tenant: { tenant_id: "skydeals" } });
});

test("the HTTP status is never mistaken for the envelope status", () => {
  // Regression: callers compared response.status (200) with "success", so this
  // shape used to throw even though the request had succeeded.
  const response = { status: 200, data: { status: "success", data: { tenant: null } } };
  assert.doesNotThrow(() => unwrapPortalResponse(response));
  assert.deepEqual(unwrapPortalResponse(response), { tenant: null });
});

test("surfaces the server's message when the envelope reports an error", () => {
  const response = { status: 200, data: { status: "error", error: { code: "no_license", message: "This tenant has no license." } } };
  assert.throws(() => unwrapPortalResponse(response), /This tenant has no license\./);
});

test("a malformed or empty response throws rather than returning undefined", () => {
  assert.throws(() => unwrapPortalResponse(undefined), /Unable to reach the Partner Portal/);
  assert.throws(() => unwrapPortalResponse({}), /Unable to reach the Partner Portal/);
  assert.throws(() => unwrapPortalResponse({ data: {} }), /Unable to reach the Partner Portal/);
});
