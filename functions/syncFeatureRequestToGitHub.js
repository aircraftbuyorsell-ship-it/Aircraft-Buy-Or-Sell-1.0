import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const REPO_OWNER = "aircraftbuyorsell-ship-it";
const REPO_NAME = "abos-0.8-intrazone";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    if (!data || !data.title) {
      return Response.json({ error: "No feature request data" }, { status: 400 });
    }

    const featureRequestId = event?.entity_id || data.id;

    // Get GitHub access token from shared connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("github");

    // Build issue body
    const issueBody = [
      data.description || "",
      "",
      "---",
      `**Category:** ${data.category || "other"}`,
      `**Submitted by:** ${data.submitter_email || "unknown"}`,
      `**ATI Feature Request ID:** ${featureRequestId}`,
    ].join("\n");

    const labels = ["feature-request", data.category || "other"].filter(Boolean);

    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: `[Feature] ${data.title}`,
          body: issueBody,
          labels,
        }),
      },
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      return Response.json(
        { error: `GitHub API error: ${ghRes.status} - ${errText}` },
        { status: 502 },
      );
    }

    const issue = await ghRes.json();

    // Update the FeatureRequest with GitHub issue info
    await base44.asServiceRole.entities.FeatureRequest.update(featureRequestId, {
      github_issue_number: issue.number,
      github_issue_url: issue.html_url,
    });

    return Response.json({
      success: true,
      issue_number: issue.number,
      issue_url: issue.html_url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});