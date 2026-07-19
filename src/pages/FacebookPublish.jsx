import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Facebook, Loader2, Link2, Unlink, Send, Building2, User, RefreshCw,
} from "lucide-react";
import PageList from "@/components/facebook/PageList";
import ListingPicker from "@/components/facebook/ListingPicker";
import PostPreview from "@/components/facebook/PostPreview";
import RecentPosts from "@/components/facebook/RecentPosts";

const CONNECTOR_ID = "6a5c242aee39d843261a3df8";

export default function FacebookPublish() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("shared"); // "shared" | "app_user"
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [customNote, setCustomNote] = useState("");
  const [posts, setPosts] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [connected, setConnected] = useState(false); // app-user connection state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load active listings once
  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.AircraftListing.filter({ status: "active" }, "-updated_date", 100);
        setListings(data || []);
      } catch { /* skip */ }
      setLoadingListings(false);
    })();
  }, []);

  // Auth check
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    });
  }, []);

  // Fetch pages for the active mode — also doubles as connection check for app-user
  const fetchPages = useCallback(async (currentMode) => {
    setLoadingPages(true);
    setError("");
    try {
      const res = await base44.functions.invoke("facebookPublishListing", {
        action: "list_pages",
        mode: currentMode,
      });
      setPages(res.data.pages || []);
      setConnected(true);
    } catch (e) {
      setPages([]);
      setConnected(false);
      if (currentMode === "app_user") {
        // expected when not yet connected
      } else {
        setError(e.response?.data?.error || e.message || "Failed to load pages");
      }
    }
    setLoadingPages(false);
  }, []);

  // Fetch recent posts for the selected page
  const fetchPosts = useCallback(async () => {
    if (!selectedPage) { setPosts([]); return; }
    setLoadingPosts(true);
    try {
      const res = await base44.functions.invoke("facebookPublishListing", {
        action: "list_posts",
        mode,
        pageId: selectedPage.id,
      });
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    }
    setLoadingPosts(false);
  }, [selectedPage, mode]);

  // Load pages when mode changes (shared loads immediately; app_user loads only if connected)
  useEffect(() => {
    if (!user) return;
    if (mode === "shared") {
      fetchPages("shared");
    } else {
      // app_user: try fetch (will set connected=false if not connected yet)
      fetchPages("app_user");
    }
    setSelectedPage(null);
    setPosts([]);
  }, [mode, user, fetchPages]);

  // Load posts when page changes
  useEffect(() => {
    fetchPosts();
  }, [selectedPage, fetchPosts]);

  // App-user OAuth connect flow
  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchPages("app_user");
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setPages([]);
    setSelectedPage(null);
    setPosts([]);
  };

  const handlePublish = async () => {
    if (!selectedPage || (!selectedListing && !customNote)) return;
    setPublishing(true);
    setError("");
    try {
      const res = await base44.functions.invoke("facebookPublishListing", {
        action: "publish",
        mode,
        pageId: selectedPage.id,
        listingId: selectedListing?.id || undefined,
        message: customNote || undefined,
      });
      if (res.data.success) {
        setCustomNote("");
        await fetchPosts();
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to publish");
    }
    setPublishing(false);
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-[#f5c242]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <Facebook className="w-10 h-10 text-[#1877f2] mb-3" />
        <h2 className="text-lg font-bold text-white/90 mb-2">Sign in required</h2>
        <p className="text-sm text-white/50 mb-4 max-w-sm">
          Sign in to publish aircraft listings to your Facebook Page.
        </p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: "#1877f2", color: "#fff" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(24,119,242,0.10)", border: "0.5px solid rgba(24,119,242,0.22)" }}
          >
            <Facebook size={20} style={{ color: "#1877f2" }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1877f2]">Facebook Pages</p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">Publish Aircraft Listings</h1>
          </div>
        </div>
        <p className="text-[13px] text-white/50 max-w-2xl">
          Post new aircraft listings to your Facebook Page feed. Choose the company Page (shared) or connect
          your own Facebook account to publish to Pages you manage.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="px-4 md:px-8 pb-4">
        <div
          className="inline-flex rounded-xl p-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => handleModeChange("shared")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === "shared" ? "text-[#04060a]" : "text-white/50 hover:text-white/80"
            }`}
            style={mode === "shared" ? { background: "#1877f2", color: "#fff" } : {}}
          >
            <Building2 className="w-3.5 h-3.5" /> Company Page
          </button>
          <button
            onClick={() => handleModeChange("app_user")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              mode === "app_user" ? "text-[#04060a]" : "text-white/50 hover:text-white/80"
            }`}
            style={mode === "app_user" ? { background: "#1877f2", color: "#fff" } : {}}
          >
            <User className="w-3.5 h-3.5" /> My Facebook
          </button>
        </div>
      </div>

      {/* App-user not connected gate */}
      {mode === "app_user" && !connected ? (
        <div className="px-4 md:px-8 pb-10">
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(24,119,242,0.08)" }}
            >
              <Link2 className="w-7 h-7 text-[#1877f2]" />
            </div>
            <h2 className="text-base font-bold text-white/90 mb-1.5">Connect your Facebook account</h2>
            <p className="text-[12px] text-white/50 max-w-md mx-auto mb-5">
              Connect your personal Facebook account to publish listings to Pages you manage.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#1877f2", color: "#fff" }}
            >
              <Link2 className="w-4 h-4" /> Connect Facebook
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-10 grid lg:grid-cols-[300px_1fr_340px] gap-5">
          {/* Column 1: Pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Facebook Pages</p>
              {mode === "app_user" && connected && (
                <button
                  onClick={handleDisconnect}
                  className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
                >
                  <Unlink className="w-3 h-3" /> Disconnect
                </button>
              )}
            </div>
            {error && mode === "shared" ? (
              <div className="text-center py-6 px-3">
                <p className="text-[11px] text-red-400 mb-3">{error}</p>
                <button
                  onClick={() => fetchPages("shared")}
                  className="text-[11px] text-[#1877f2] hover:underline flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : (
              <PageList
                pages={pages}
                selectedPageId={selectedPage?.id}
                onSelect={setSelectedPage}
                loading={loadingPages}
              />
            )}
          </div>

          {/* Column 2: Listing picker + preview */}
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-3">Select Listing</p>
              <ListingPicker
                listings={listings}
                selectedId={selectedListing?.id}
                onSelect={setSelectedListing}
                loading={loadingListings}
              />
            </div>

            <PostPreview listing={selectedListing} customNote={customNote} />

            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1.5 block">
                Custom Note (optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add a call-to-action or extra details..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.10)",
                  color: "white",
                }}
              />
            </div>

            {error && mode === "app_user" && (
              <p className="text-[11px] text-red-400">{error}</p>
            )}

            <button
              onClick={handlePublish}
              disabled={!selectedPage || (!selectedListing && !customNote) || publishing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
              style={{ background: "#1877f2", color: "#fff" }}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {publishing ? "Publishing..." : `Publish to ${selectedPage?.name || "Page"}`}
            </button>
          </div>

          {/* Column 3: Recent posts */}
          <div
            className="rounded-xl p-4 h-fit"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            {selectedPage ? (
              <RecentPosts posts={posts} loading={loadingPosts} onRefresh={fetchPosts} />
            ) : (
              <p className="text-[11px] text-white/35 text-center py-6">Select a Page to view recent posts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}