# Facebook Group auto-link webhook — configuration

The `facebookGroupWebhook` Base44 function turns aircraft posts in the ABOS
Facebook Group into an ABOS link. This page lists the environment variables it
reads and how to set them.

**Values are never stored in this repository.** Set them in the Base44
dashboard → your app → Settings → Environment variables. Once saved, open
Marketing Operations (`/admin/marketing`) → Facebook Group Assistant: the status
strip at the top reports which variables Base44 actually has (presence only —
values are never returned to the browser).

## Variables

| Name | Required | Kind | Purpose |
| --- | --- | --- | --- |
| `META_VERIFY_TOKEN` | yes | secret | Answer Meta's `hub.challenge` subscription handshake. Any long random string; paste the same value into the Meta app's webhook config. |
| `META_APP_SECRET` | yes | secret | Verifies the `X-Hub-Signature-256` HMAC on every delivery. Meta app → Settings → Basic → App Secret. Unsigned deliveries are rejected. |
| `META_PAGE_ID` | recommended | config | ABOS's own Page ID. Loop protection: events authored by this ID are ignored so ABOS never replies to itself. |
| `META_APP_SCOPED_ID` | recommended | config | App-scoped user ID that posts as ABOS, for the same loop protection. |
| `FB_AUTO_COMMENT_ENABLED` | no | config | `true` allows posting real comments. Defaults to `false` — parse, score and log only. |
| `FB_AUTO_COMMENT_MIN_CONFIDENCE` | no | config | Confidence floor (0–1) for automatic comments. Defaults to `0.9`; an unparseable value falls back to `0.9` rather than to `0`. |
| `BASE44_APP_URL` | no | config | Public ABOS origin for generated links. Shared with the other Base44 functions; defaults to `https://aircraftbuyorsell.com`. |

These names are registered in `task002/secret-registry.json` (names and
metadata only, per that registry's `values_in_source_control: false` policy).

## Meta app setup

1. In the Meta app dashboard, add the **Webhooks** product.
2. Callback URL: the deployed `facebookGroupWebhook` function URL — the
   Assistant's status strip prints the exact URL for this deployment.
3. Verify token: the same string as `META_VERIFY_TOKEN`.
4. Subscribe to the group's `feed` field.

## Permission status

Automatic commenting additionally requires `groups_access_member_info` and
`publish_to_groups`, granted through Meta App Review with the app installed in
the group by a group admin. Until that is granted, leave
`FB_AUTO_COMMENT_ENABLED` at `false`: the webhook still classifies and logs every
event, and the Assistant produces the link, comment copy and branded card for
posting by hand.
