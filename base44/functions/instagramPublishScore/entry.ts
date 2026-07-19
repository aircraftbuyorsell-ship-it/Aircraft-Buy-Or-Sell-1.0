import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const IG_API = "https://graph.instagram.com";
const CONNECTOR_ID = "6a5c2767fffbeca489c4de53";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Get Instagram user info (also serves as connection check)
    if (action === "me") {
      const r = await fetch(`${IG_API}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
      const data = await r.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
      return Response.json({ igUserId: data.id, username: data.username });
    }

    // List user's ATI passports for score sharing
    if (action === "list_passports") {
      const passports = await base44.asServiceRole.entities.ATIPassport.filter(
        { triggered_by: user.id },
        "-created_date",
        20
      );
      return Response.json({ passports: passports || [] });
    }

    // Publish a transparency score card to Instagram feed
    if (action === "publish") {
      const { passportId, caption } = body;
      if (!passportId) return Response.json({ error: "passportId required" }, { status: 400 });

      const passport = await base44.asServiceRole.entities.ATIPassport.get(passportId);
      if (!passport) return Response.json({ error: "Passport not found" }, { status: 404 });

      // Verify ownership
      if (passport.triggered_by !== user.id && user.role !== "admin") {
        return Response.json({ error: "Not authorized to share this passport" }, { status: 403 });
      }

      // Get IG user ID
      const meRes = await fetch(`${IG_API}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
      const meData = await meRes.json();
      if (meData.error) return Response.json({ error: meData.error.message }, { status: 400 });
      const igUserId = meData.id;

      const atiTotal = passport.ati_total || 0;
      const scoreLabel = passport.score_label || "—";
      const dealLabel = passport.deal_label || "";
      const omvm = passport.omvm_value ? `$${Number(passport.omvm_value).toLocaleString()}` : "";

      // Generate a branded score card image
      const imagePrompt = `Professional aviation transparency score card, square 1080x1080 format.
Aircraft registration "${passport.registration}" displayed prominently at top in clean white sans-serif.
Large gold metallic number "${atiTotal}/120" as the centerpiece — the ATI (Aircraft Transparency Index) score.
Label "${scoreLabel}" below the score in uppercase tracking.
${dealLabel ? `Deal assessment badge: "${dealLabel}".` : ""}
${omvm ? `Market value: ${omvm}.` : ""}
Dark navy gradient background (#0B1220 to #1a2333) with gold (#D4A017) accent lines and subtle silver dots.
Minimalist aviation theme — a faint aircraft silhouette or compass rose watermark.
"ABOS Marketspace" branding text at bottom in small gold letters.
High-end, data-card aesthetic, suitable for Instagram feed. No photorealistic faces.`;

      const imgResult = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      const imageUrl = imgResult.url || imgResult.file_url;
      if (!imageUrl) return Response.json({ error: "Failed to generate score card image" }, { status: 500 });

      // Build caption
      const defaultCaption = `✈️ ${passport.registration} — Aircraft Transparency Index

📊 ATI Score: ${atiTotal}/120
🏷️ Rating: ${scoreLabel}${dealLabel ? `\n🎯 Deal Assessment: ${dealLabel}` : ""}${omvm ? `\n💰 Market Value: ${omvm}` : ""}${passport.ai_summary ? `\n\n${passport.ai_summary}` : ""}

Powered by ABOS Marketspace — aviation market intelligence & transparency.
#abos #aviation #aircraftforsale #transparency #ATI #aircraft`;

      let finalCaption = (caption || defaultCaption).slice(0, 2200);

      // Step 1: Create media container
      const containerBody = new URLSearchParams();
      containerBody.set("image_url", imageUrl);
      containerBody.set("caption", finalCaption);
      containerBody.set("access_token", accessToken);

      const containerRes = await fetch(`${IG_API}/v25.0/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerBody,
      });
      const containerData = await containerRes.json();
      if (containerData.error) return Response.json({ error: containerData.error.message }, { status: 400 });

      // Step 2: Publish
      const publishBody = new URLSearchParams();
      publishBody.set("creation_id", containerData.id);
      publishBody.set("access_token", accessToken);

      const publishRes = await fetch(`${IG_API}/v25.0/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishBody,
      });
      const publishData = await publishRes.json();
      if (publishData.error) return Response.json({ error: publishData.error.message }, { status: 400 });

      return Response.json({
        success: true,
        mediaId: publishData.id,
        imageUrl,
        caption: finalCaption,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});