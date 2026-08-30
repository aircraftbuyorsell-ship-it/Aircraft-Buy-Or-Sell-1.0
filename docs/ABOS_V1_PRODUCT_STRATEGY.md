# ABOS V1 Product Strategy

## Primary commercial ladder

| Product | Price | Role |
|---|---:|---|
| Free Advisor | $0 | Acquisition / highest user volume |
| ATI Report | $39 | First paid conversion / highest order volume target |
| Deal Analysis | $99 | Core revenue product |
| Investment | $149 | Strong upsell |
| Professional Review | from $499 | High-value expert trust layer |

## UX principle

Advisor remains free. It should identify the user's intent and recommend the smallest paid product that answers the question. Paid products are progressive: a higher tier includes the value of lower tiers and should reuse the same aircraft context and prior analysis rather than forcing the customer to restart.

## Aircraft context

Every paid workflow should retain the aircraft registration/tail number, canonical aircraft ID when available, listing context, user/session context, and source provenance. Successful payment returns the user to the same aircraft and Advisor session.

## Professional boundary

AI-generated analysis must remain distinguishable from professional review. Professional Review is only represented as professionally reviewed when an appropriately credentialed aviation professional has actually completed the review. Do not imply certification, appraisal status, legal advice, tax advice, insurance advice, or inspection completion unless the relevant professional/service actually performed it.

## Checkout security

The browser must never be trusted to define the price or entitlement. The server allowlists Stripe Price IDs and derives product/entitlement metadata server-side. Stripe webhooks remain the source of truth for successful payment before paid access is granted.

## V1 scope

Do not expose additional legacy buyer, seller, marketplace, white-label or enterprise plans on the primary consumer pricing surface until this five-product funnel is proven.
