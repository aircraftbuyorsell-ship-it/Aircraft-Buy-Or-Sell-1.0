import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Applies a user's personalization (colors, font, logo) to the live app.
 * Only active when user has personalization_enabled = true AND plan is pro/enterprise.
 */
export function useBranding() {
  const { data: user } = useQuery({
    queryKey: ["auth-me-brand"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isPremium = user?.plan === "pro" || user?.plan === "enterprise";
  const active = !!user?.personalization_enabled && isPremium;

  useEffect(() => {
    const root = document.documentElement;

    if (!active) {
      // Reset to defaults
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-bg");
      root.style.removeProperty("--brand-font");
      document.body.style.removeProperty("font-family");
      document.body.style.removeProperty("background-color");
      return;
    }

    if (user?.brand_primary_color) root.style.setProperty("--brand-primary", user.brand_primary_color);
    if (user?.brand_accent_color) root.style.setProperty("--brand-accent", user.brand_accent_color);
    if (user?.brand_background_color) {
      root.style.setProperty("--brand-bg", user.brand_background_color);
      document.body.style.backgroundColor = user.brand_background_color;
    }
    if (user?.brand_font) {
      root.style.setProperty("--brand-font", user.brand_font);
      document.body.style.fontFamily = `'${user.brand_font}', system-ui, sans-serif`;
    }
  }, [active, user]);

  return { user, isPremium, active };
}