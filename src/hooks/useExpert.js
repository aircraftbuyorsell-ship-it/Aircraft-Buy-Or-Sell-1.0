import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/** Fetch the ExpertProfile for a given user. */
export function useExpertProfile(userId) {
  return useQuery({
    queryKey: ["expert-profile", userId],
    queryFn: async () => {
      const all = await base44.entities.ExpertProfile.filter({ user_id: userId }, "-created_date", 1);
      return all[0] || null;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

/** Fetch the ExpertCrossCheck for a registration + requester. */
export function useExpertCrossCheck(registration, userEmail) {
  return useQuery({
    queryKey: ["expert-crosscheck", registration, userEmail],
    queryFn: async () => {
      const all = await base44.entities.ExpertCrossCheck.filter(
        { registration, requester_email: userEmail },
        "-created_date", 1
      );
      return all[0] || null;
    },
    enabled: !!registration && !!userEmail,
    staleTime: 15000,
  });
}

/** Fetch all bids for a crosscheck. */
export function useExpertBids(crosscheckId) {
  return useQuery({
    queryKey: ["expert-bids", crosscheckId],
    queryFn: async () => {
      return await base44.entities.ExpertBid.filter(
        { crosscheck_id: crosscheckId },
        "price_eur", 50
      );
    },
    enabled: !!crosscheckId,
    staleTime: 10000,
  });
}

/** Check if a registration has a confirmed expert verification (for ComplianceBadge). */
export function useExpertVerified(registration) {
  return useQuery({
    queryKey: ["expert-verified", registration],
    queryFn: async () => {
      const all = await base44.entities.ExpertCrossCheck.filter(
        { registration, status: "completed", verdict: "confirmed" },
        "-completed_at", 1
      );
      return all[0] || null;
    },
    enabled: !!registration,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });
}

/** Fetch all open crosschecks (for expert dashboard). */
export function useOpenCrossChecks(expertEmail) {
  return useQuery({
    queryKey: ["expert-open-crosschecks", expertEmail],
    queryFn: async () => {
      const all = await base44.entities.ExpertCrossCheck.filter(
        { status: "open" },
        "-created_date", 50
      );
      // Filter out crosschecks the expert already bid on
      if (!expertEmail) return all;
      const myBids = await base44.entities.ExpertBid.filter(
        { expert_email: expertEmail },
        "-created_date", 100
      );
      const bidIds = new Set(myBids.map(b => b.crosscheck_id));
      return all.filter(c => !bidIds.has(c.id));
    },
    staleTime: 15000,
  });
}

/** Fetch crosschecks assigned to the expert (in_progress). */
export function useExpertAssignments(expertId) {
  return useQuery({
    queryKey: ["expert-assignments", expertId],
    queryFn: async () => {
      return await base44.entities.ExpertCrossCheck.filter(
        { expert_id: expertId, status: "in_progress" },
        "-created_date", 50
      );
    },
    enabled: !!expertId,
    staleTime: 10000,
  });
}

/** Fetch expert's completed crosschecks. */
export function useExpertHistory(expertId) {
  return useQuery({
    queryKey: ["expert-history", expertId],
    queryFn: async () => {
      return await base44.entities.ExpertCrossCheck.filter(
        { expert_id: expertId, status: "completed" },
        "-completed_at", 50
      );
    },
    enabled: !!expertId,
    staleTime: 30000,
  });
}

/** Check if the current user is an assigned expert for a registration (for GCR access bypass). */
export function useExpertAssignmentForReg(registration, userId) {
  return useQuery({
    queryKey: ["expert-assignment-reg", registration, userId],
    queryFn: async () => {
      const all = await base44.entities.ExpertCrossCheck.filter(
        { registration, expert_id: userId, status: "in_progress" },
        "-created_date", 1
      );
      return all[0] || null;
    },
    enabled: !!registration && !!userId,
    staleTime: 30000,
  });
}

/** Fetch pending expert profiles (for admin panel). */
export function usePendingExpertProfiles(isAdmin) {
  return useQuery({
    queryKey: ["expert-pending-profiles"],
    queryFn: async () => {
      return await base44.entities.ExpertProfile.filter(
        { verified_status: "pending" },
        "-created_date", 50
      );
    },
    enabled: !!isAdmin,
    staleTime: 30000,
  });
}

/** Fetch all expert profiles (for admin oversight). */
export function useAllExpertProfiles(isAdmin) {
  return useQuery({
    queryKey: ["expert-all-profiles"],
    queryFn: async () => {
      return await base44.entities.ExpertProfile.filter(
        {}, "-created_date", 100
      );
    },
    enabled: !!isAdmin,
    staleTime: 30000,
  });
}

/** Fetch completed crosscheck for a registration (for result display). */
export function useCompletedCrossCheck(registration) {
  return useQuery({
    queryKey: ["expert-completed", registration],
    queryFn: async () => {
      const all = await base44.entities.ExpertCrossCheck.filter(
        { registration, status: "completed" },
        "-completed_at", 1
      );
      return all[0] || null;
    },
    enabled: !!registration,
    staleTime: 30000,
  });
}