import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const money = (value, currency = "USD") => value ? new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value) : "Price on request";
const template = (listing, market) => {
  if (!listing) return "";
  const identity = [listing.year, listing.make, listing.model].filter(Boolean).join(" ");
  const marketLine = market?.summary ? `Market snapshot: ${market.summary.active || 0} active aircraft · median asking ${money(market.summary.medianPrice)}${market.delta?.pct != null ? ` · 12-month trend ${market.delta.pct > 0 ? "+" : ""}${market.delta.pct}%` : ""}.` : "";
  return `${identity}${listing.registration ? ` · ${listing.registration}` : ""}\n\nNow available for ${money(listing.asking_price, listing.currency)}.${listing.ati_score != null ? ` ATI trust score: ${listing.ati_score}/120.` : ""}${listing.omvm_value ? ` OMVM estimate: ${money(listing.omvm_value, listing.currency)}.` : ""}\n\n${marketLine}${listing.description ? `\n\n${listing.description}` : ""}\n\n#AircraftForSale #Aviation #ABOS`;
};

export default function useSocialPublisher() {
  const [data, setData] = useState({ listings: [], destinations: [], history: [], market: null });
  const [listingId, setListingId] = useState("");
  const [selected, setSelected] = useState([]);
  const [copy, setCopy] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState(null);
  const listing = useMemo(() => data.listings.find((item) => item.id === listingId), [data.listings, listingId]);
  const load = async () => {
    setLoading(true);
    try {
      const [listings, marketRes, destinationsRes, history] = await Promise.all([
        base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 50),
        base44.functions.invoke("computeMarketAnalytics", {}),
        base44.functions.invoke("metaPublishToPage", { action: "listDestinations" }),
        base44.entities.MarketingPost.list("-published_at", 20),
      ]);
      const next = { listings, market: marketRes.data, destinations: destinationsRes.data.destinations || [], history };
      setData(next);
      if (!listingId && listings[0]) setListingId(listings[0].id);
    } catch (error) { setMessage({ type: "error", text: error?.response?.data?.error || "Unable to load social publishing data." }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setCopy(template(listing, data.market)); }, [listing, data.market]);
  const publish = async () => {
    if (!listing || !selected.length || !copy.trim()) return;
    setPublishing(true); setMessage(null);
    const targets = data.destinations.filter((item) => selected.includes(item.key));
    const results = await Promise.allSettled(targets.map((target) => base44.functions.invoke("metaPublishToPage", { action: "publish", channel: target.channel, destinationId: target.id, sourceType: "AircraftListing", sourceId: listing.id, copy, imageUrl: listing.photo_url || "", linkUrl: listing.source_url || "" })));
    const successful = results.filter((item) => item.status === "fulfilled").length;
    setMessage({ type: successful === targets.length ? "success" : "error", text: successful ? `Published to ${successful} of ${targets.length} selected channels.` : "Publishing failed. Check the listing photo and social connections." });
    const history = await base44.entities.MarketingPost.list("-published_at", 20);
    setData((current) => ({ ...current, history })); setPublishing(false);
  };
  return { ...data, listing, listingId, setListingId, selected, setSelected, copy, setCopy, loading, publishing, message, publish, refresh: load };
}