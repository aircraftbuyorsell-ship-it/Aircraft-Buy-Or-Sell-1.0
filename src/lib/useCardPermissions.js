import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Returns { canEdit, isAdmin, user } for a given ATICard.
 * Edit rights match ATICard RLS: issuer, card_owner, subject_owner,
 * subject_operator, distribution_owner, or admin.
 */
export function useCardPermissions(card) {
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const email = user?.email?.toLowerCase();
  const isAdmin = user?.role === "admin";
  const canEdit = !!card && !!email && (
    isAdmin ||
    card.issuer_email?.toLowerCase() === email ||
    card.card_owner_email?.toLowerCase() === email ||
    card.subject_owner_email?.toLowerCase() === email ||
    card.subject_operator_email?.toLowerCase() === email ||
    card.distribution_owner_email?.toLowerCase() === email
  );

  return { canEdit, isAdmin, user };
}