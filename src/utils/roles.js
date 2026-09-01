/**
 * Role helpers.
 *
 * `super_admin` is strictly above `admin`, so every admin-gated capability must
 * accept it too. Spelling the pair out at each call site let them drift: several
 * components checked only `admin` and silently hid features from super admins,
 * including the whole Administration section of the account menu.
 */

export const ADMIN_ROLES = Object.freeze(["admin", "super_admin"]);

/** True when the user may do anything an admin may do. */
export function isAdminRole(user) {
  return ADMIN_ROLES.includes(user?.role);
}
