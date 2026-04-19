import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Radio as RadioIcon, Search, X, Play, Pause, Loader2, Globe, Shuffle } from "lucide-react";
import { useRadioPlayer } from "@/lib/useRadioPlayer";
import CountryPicker from "@/components/radio/CountryPicker";
import GenrePicker from "@/components/radio/GenrePicker";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

async function callRadio(action, params = {}) {
  const res = await base44.functions.invoke("radioProxy", { action, params });
  return res.data?.data || [];
}

function StationCard({ station }) {
  const { station: current, playing, loading, player } = useRadioPlayer();
  const isActive = current?.id === station.id;
  const country = station.location?.countryName || "";
  const genre = station.genre?.text || "";

  return (
    <div className={`bg-white border rounded-xl p-4 transition-all ${isActive ? "border-[#E8A83A] shadow-md" : "border-black/[0.07] hover:border-[#0B2D5B]/30"}`}>
      <div className="flex items-center gap-3">
        {station.logo ? (
          <img src={station.logo} alt="" className="w-12 h-12 rounded-md object-cover bg-black/5 shrink-0" onError={(e) => e.currentTarget.style.display = "none"} />
        ) : (
          <div className="w-12 h-12 rounded-md bg-[#E8A83A]/15 flex items-center justify-center shrink-0">
            <RadioIcon className="w-5 h-5 text-[#E8A83A]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#1A1814] truncate">{station.name}</p>
          <p className="text-[11px] text-[#6B6560] truncate">{country}{genre ? ` · ${genre}` : ""}</p>
        </div>
        <button
          onClick={() => isActive ? player.toggle() : player.play(station)}
          className="w-9 h-9 rounded-full bg-[#0B2D5B] hover:bg-[#143C75] text-white flex items-center justify-center shrink-0"
          aria-label={isActive && playing ? "Pause" : "Play"}
        >
          {isActive && loading ? <Loader2 className="w-4 h-4 animate-spin" />
            : isActive && playing ? <Pause className="w-4 h-4" />
            : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}

export default function Radio() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [country, setCountry] = useState("");
  const [genreId, setGenreId] = useState("");
  const [randomMode, setRandomMode] = useState(false);

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ["radio-countries"],
    queryFn: () => callRadio("countries"),
    staleTime: 60 * 60 * 1000,
  });

  const { data: genres = [], isLoading: loadingGenres } = useQuery({
    queryKey: ["radio-genres-all"],
    queryFn: () => callRadio("allGenres"),
    staleTime: 60 * 60 * 1000,
  });

  const { data: genreStations = [], isLoading: loadingGenre } = useQuery({
    queryKey: ["radio-genre-stations", genreId],
    queryFn: () => callRadio("genreRadios", { genreId, page: 1, limit: 30 }),
    enabled: !!genreId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: popular = [], isLoading: loadingPop } = useQuery({
    queryKey: ["radio-popular", country],
    queryFn: () => callRadio("popular", { limit: 24, ...(country ? { country } : {}) }),
    staleTime: 10 * 60 * 1000,
    enabled: !genreId && !randomMode,
  });

  const { data: randomStations = [], isLoading: loadingRandom, refetch: refetchRandom } = useQuery({
    queryKey: ["radio-random"],
    queryFn: () => callRadio("random", { limit: 12 }),
    enabled: randomMode,
    staleTime: 0,
  });

  const { data: results = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["radio-search", submitted, country],
    queryFn: () => callRadio("search", { q: submitted, limit: 30, ...(country ? { country } : {}) }),
    enabled: !!submitted,
    staleTime: 5 * 60 * 1000,
  });

  const onSubmit = (e) => { e.preventDefault(); setSubmitted(query.trim()); };

  const list = submitted ? results : randomMode ? randomStations : genreId ? genreStations : popular;
  const isLoading = submitted ? loadingSearch : randomMode ? loadingRandom : genreId ? loadingGenre : loadingPop;
  const selectedGenre = genres.find((g) => String(g.id) === String(genreId));

  const handleSurprise = () => {
    setSubmitted(""); setQuery(""); setGenreId(""); setCountry("");
    if (randomMode) refetchRandom(); else setRandomMode(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>Background · Live Radio</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Radio</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Stream 50,000+ stations while you work the deal floor.</p>
      </div>

      <div className="px-4 md:px-8 pb-4">
        <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search station name, genre, or city…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setSubmitted(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <CountryPicker
            countries={countries}
            value={country}
            onChange={setCountry}
            loading={loadingCountries}
          />
          <GenrePicker
            genres={genres}
            value={genreId}
            onChange={(id) => { setGenreId(id); setRandomMode(false); }}
            loading={loadingGenres}
          />
          <button
            type="button"
            onClick={handleSurprise}
            className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-black uppercase tracking-wider transition-colors ${
              randomMode
                ? "bg-[#E8A83A] border-[#E8A83A] text-[#0B2D5B]"
                : "bg-white border-[#E8A83A]/40 text-[#A67C00] hover:bg-[#E8A83A] hover:text-[#0B2D5B]"
            }`}
            title="Random stations"
          >
            <Shuffle className="w-4 h-4" />
            Surprise
          </button>
          <button type="submit"
            className="px-5 py-2.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-black uppercase tracking-wider rounded-xl">
            Search
          </button>
        </form>
      </div>

      <div className="px-4 md:px-8 pb-24">
        <div className="flex items-center gap-2 mb-3">
          {randomMode ? <Shuffle className="w-3.5 h-3.5 text-[#E8A83A]" /> : <Globe className="w-3.5 h-3.5 text-[#E8A83A]" />}
          <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">
            {submitted
              ? `Results for "${submitted}"`
              : randomMode
                ? "Random picks · discover new stations"
                : selectedGenre
                  ? `Genre · ${selectedGenre.name || selectedGenre.text}`
                  : `Popular ${country || "worldwide"}`}
            {(country || genreId || randomMode) && !submitted && (
              <button
                onClick={() => { setCountry(""); setGenreId(""); setRandomMode(false); }}
                className="ml-2 text-[#C0392B] normal-case tracking-normal font-semibold"
              >
                clear
              </button>
            )}
            {randomMode && !submitted && (
              <button
                onClick={() => refetchRandom()}
                className="ml-2 text-[#A67C00] normal-case tracking-normal font-semibold"
              >
                shuffle again
              </button>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => <div key={i} className="h-20 bg-white border border-black/[0.05] rounded-xl animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center text-[#AAA49C]">
            <RadioIcon className="w-10 h-10 mx-auto opacity-30 mb-3" />
            <p className="text-sm font-medium">No stations found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((s) => <StationCard key={s.id} station={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}