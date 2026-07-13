import { base44 } from "@/api/base44Client";

export const FIELD_GROUPS = [
  { title: "Aircraft Identity", fields: [["registration_number", "United States Registration Number"], ["manufacturer", "Aircraft Manufacturer"], ["model", "Aircraft Model"], ["serial_number", "Aircraft Serial Number"]] },
  { title: "Sale Details", fields: [["consideration_amount", "Consideration amount (USD)", "number"], ["sale_day", "Sale day", "number"], ["sale_month", "Sale month"], ["sale_year", "Sale year", "number"]] },
  { title: "Purchaser", fields: [["purchaser_name", "Purchaser legal name"], ["registration_applicant_name", "AC Form 8050-1 applicant name"], ["purchaser_street", "Street"], ["purchaser_apt_suite", "Apt / Suite"], ["purchaser_city", "City"], ["purchaser_state", "State / Province / Country"], ["purchaser_zip", "ZIP / Postal code"], ["purchaser_phone", "Telephone", "tel"], ["purchaser_email", "Email", "email"]] },
  { title: "Seller", fields: [["seller_name", "Seller legal name"], ["seller_email", "Seller email", "email"], ["dealer_certificate_number", "Dealer certificate number"], ["seller_title", "Seller title"], ["owner_count", "Registered owner count", "number"], ["signature_count", "Signatures collected", "number"]] },
];

const clean = (value) => String(value || "").trim().toUpperCase();
const nNumber = (value) => clean(value).replace(/^N/, "").replace(/[^A-Z0-9]/g, "");
const confidence = (source, level) => ({ source, level, score: level === "verified" ? .95 : level === "likely" ? .75 : .3 });

export async function resolveAircraft(mode, query) {
  const q = String(query || "").trim();
  if (!q) throw new Error("Enter an aircraft, listing, profile, or deal reference.");
  let registration = q, listing = null, profile = null, deal = null;
  if (mode === "serial") {
    const rows = await base44.entities.FAAAircraft.filter({ serial_number: q }, "-created_date", 1);
    if (!rows.length) throw new Error("No FAA aircraft found for that serial number.");
    registration = `N${rows[0].n_number}`;
  }
  if (mode === "listing") {
    const rows = await base44.entities.AircraftListing.filter(q.startsWith("http") ? { source_url: q } : { id: q }, "-created_date", 1);
    if (!rows.length) throw new Error("Listing not found.");
    listing = rows[0]; registration = listing.registration;
  }
  if (mode === "profile") {
    const rows = await base44.entities.ATIPassport.filter(q.toUpperCase().startsWith("N") ? { registration: q.toUpperCase() } : { id: q }, "-created_date", 1);
    if (!rows.length) throw new Error("Aircraft profile not found.");
    profile = rows[0]; registration = profile.registration;
  }
  if (mode === "deal") {
    const rows = await base44.entities.SalesPipeline.filter({ id: q }, "-created_date", 1);
    if (!rows.length) throw new Error("Deal not found.");
    deal = rows[0]; registration = deal.registration;
  }
  if (!registration) return { found: true, source: "abos_listing", aircraft: { make: listing?.make, model: listing?.model }, listing, profile, deal };
  const response = await base44.functions.invoke("registryLookup", { registration });
  return { ...response.data, listing: response.data.listing || listing, profile, deal };
}

export function buildDraft(lookup) {
  const aircraft = lookup.aircraft || {}, listing = lookup.listing || {}, deal = lookup.deal || {};
  const authoritative = ["faa_entity", "supabase"].includes(lookup.source);
  const registryMeta = confidence(authoritative ? "FAA Registry" : "Aircraft registry lookup", authoritative ? "verified" : "likely");
  const field_confidence = {};
  const add = (field, value, meta) => { if (value !== undefined && value !== null && value !== "") field_confidence[field] = meta; return value ?? ""; };
  const price = deal.sale_amount || listing.asking_price || "";
  return {
    status: "needs_review", registration_number: add("registration_number", nNumber(aircraft.registration || aircraft.n_number), registryMeta),
    manufacturer: add("manufacturer", aircraft.make || listing.make, aircraft.make ? registryMeta : confidence("Aircraft Listing", "likely")),
    model: add("model", aircraft.model || listing.model, aircraft.model ? registryMeta : confidence("Aircraft Listing", "likely")),
    serial_number: add("serial_number", aircraft.serial_number, registryMeta),
    consideration_amount: add("consideration_amount", price, confidence(deal.sale_amount ? "Deal Room" : "Aircraft Listing", deal.sale_amount ? "verified" : "likely")), currency: listing.currency || "USD",
    seller_name: add("seller_name", aircraft.registered_owner, registryMeta), faa_registered_owner: aircraft.registered_owner || "",
    listing_id: listing.id || "", deal_id: deal.id || "", aircraft_id: lookup.profile?.id || "", owner_count: 1, signature_count: 0,
    chain_of_ownership_urls: [], field_confidence, source_context: { registry_source: lookup.source, faa_serial_number: aircraft.serial_number || "", listing_price_used: Boolean(!deal.sale_amount && listing.asking_price) },
    price_confirmed: false, sale_date_confirmed: false, purchaser_name_confirmed: false, user_reviewed: false,
  };
}

export function validateDraft(draft) {
  const warnings = [];
  const push = (id, message, severity = "critical") => warnings.push({ id, message, severity });
  if (!/^[0-9]{1,5}[A-Z]{0,2}$/.test(clean(draft.registration_number))) push("invalid_n_number", "Enter a valid FAA N-number without the N prefix.");
  ["manufacturer", "model", "serial_number", "purchaser_name", "purchaser_street", "purchaser_city", "purchaser_state", "seller_name"].forEach((f) => { if (!draft[f]) push(`missing_${f}`, `${f.replaceAll("_", " ")} is required.`); });
  if (draft.faa_registered_owner && clean(draft.seller_name) !== clean(draft.faa_registered_owner) && !draft.chain_of_ownership_urls?.length) push("seller_not_registered_owner", "Seller does not match the last registered owner. Attach the chain of ownership.");
  if (draft.source_context?.faa_serial_number && clean(draft.serial_number) !== clean(draft.source_context.faa_serial_number)) push("serial_number_mismatch", "Serial number differs from the FAA registry.");
  if (!draft.registration_applicant_name) push("registration_applicant_missing", "Enter the AC Form 8050-1 applicant name so the purchaser can be matched exactly.");
  if (draft.registration_applicant_name && clean(draft.purchaser_name) !== clean(draft.registration_applicant_name)) push("buyer_name_mismatch", "Purchaser name must match AC Form 8050-1 exactly.");
  if (!draft.purchaser_name_confirmed) push("buyer_name_not_confirmed", "Purchaser legal name requires explicit confirmation.", "medium");
  if (draft.purchaser_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.purchaser_email)) push("invalid_buyer_email", "Purchaser email format is invalid.", "medium");
  if (draft.seller_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.seller_email)) push("invalid_seller_email", "Seller email format is invalid.", "medium");
  if (!draft.price_confirmed) push("price_not_confirmed", draft.source_context?.listing_price_used ? "Sale price comes from the listing, not a confirmed closing price." : "Sale price requires confirmation and cannot be replaced by an OMVM estimate.", "medium");
  const date = new Date(Number(draft.sale_year), Math.max(0, new Date(`${draft.sale_month} 1, 2000`).getMonth()), Number(draft.sale_day));
  const validDate = draft.sale_day && draft.sale_month && draft.sale_year && date.getDate() === Number(draft.sale_day) && date.getFullYear() === Number(draft.sale_year);
  if (!validDate) push("invalid_sale_date", "Enter a real calendar date for the sale.", "medium");
  if (!draft.sale_date_confirmed) push("date_not_confirmed", "Date of sale must be confirmed by the user.", "medium");
  if ((Number(draft.owner_count) || 1) > (Number(draft.signature_count) || 0)) push("co_owner_missing_signature", "All registered co-owners must sign. Signatures are never autofilled.");
  return warnings;
}