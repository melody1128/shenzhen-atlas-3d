"use client";

import { useMemo, useRef, useState } from "react";
import { Building2, ChevronRight, LoaderCircle, MapPin, Search } from "lucide-react";
import { searchLocalEntries, type SearchEntry } from "@/lib/search/search";
import type { AtlasPlace } from "@/types/atlas";

interface SearchBoxProps {
  mapReady: boolean;
  onSelect: (entry: SearchEntry) => void;
  onPlaceSelect: (place: AtlasPlace) => void;
  onRemoteSearch: (query: string) => Promise<AtlasPlace[]>;
}

export function SearchBox({ mapReady, onSelect, onPlaceSelect, onRemoteSearch }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [remotePlaces, setRemotePlaces] = useState<AtlasPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const localResults = useMemo(() => searchLocalEntries(query), [query]);

  const submit = async () => {
    if (!query.trim()) return;
    if (localResults[0]) {
      onSelect(localResults[0]);
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!mapReady) {
      setRemoteError("本地目录没有匹配项；连接真实地图后可继续检索深圳 POI。");
      return;
    }
    setLoading(true);
    setRemoteError("");
    try {
      const places = await onRemoteSearch(query.trim());
      setRemotePlaces(places);
      if (!places.length) setRemoteError("未找到匹配地点，请尝试更完整的名称。 ");
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "搜索暂时不可用");
    } finally {
      setLoading(false);
    }
  };

  const chooseLocal = (entry: SearchEntry) => {
    onSelect(entry);
    setOpen(false);
    setQuery(entry.title);
  };

  const chooseRemote = (place: AtlasPlace) => {
    onPlaceSelect(place);
    setOpen(false);
    setQuery(place.name);
  };

  return (
    <div className="global-search">
      <form
        className="search-field"
        onSubmit={(event) => { event.preventDefault(); void submit(); }}
        role="search"
      >
        <Search size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setRemotePlaces([]); setRemoteError(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); inputRef.current?.blur(); } }}
          placeholder="搜索街道、城中村、商场、地铁站…"
          role="combobox"
          aria-autocomplete="list"
          aria-label="全局地点搜索"
          aria-expanded={open}
          aria-controls="search-results"
        />
        {loading ? <LoaderCircle className="spin" size={16} /> : <kbd>↵</kbd>}
      </form>
      {open && query.trim() && (
        <div className="search-results" id="search-results">
          <div className="search-results-head">
            <span>{remotePlaces.length ? "地图检索结果" : "深圳目录"}</span>
            <small>{localResults.length} 个本地匹配</small>
          </div>
          {localResults.map((entry) => (
            <button key={`${entry.kind}-${entry.id}`} type="button" className="search-result" onClick={() => chooseLocal(entry)}>
              <span className="result-icon">{entry.kind === "curated" ? <Building2 size={16} /> : <MapPin size={16} />}</span>
              <span><strong>{entry.title}</strong><small>{entry.subtitle}</small></span>
              <ChevronRight size={15} />
            </button>
          ))}
          {remotePlaces.map((place) => (
            <button key={place.id} type="button" className="search-result" onClick={() => chooseRemote(place)}>
              <span className="result-icon"><MapPin size={16} /></span>
              <span><strong>{place.name}</strong><small>{place.districtName} · {place.address || "地图服务检索结果"}</small></span>
              <ChevronRight size={15} />
            </button>
          ))}
          {(remoteError || (!localResults.length && !remotePlaces.length && !loading)) && (
            <div className="search-empty">
              <p>{remoteError || "按回车检索更多真实地点"}</p>
              {!mapReady && !remoteError && <small>当前仅搜索官方区划与内置真实地名线索。</small>}
            </div>
          )}
          {localResults.length > 0 && !remotePlaces.length && (
            <button type="button" className="search-more" onClick={() => { setRemotePlaces([]); void (async () => {
              if (!mapReady) { setRemoteError("配置地图 Key 后可检索更多真实 POI。"); return; }
              setLoading(true);
              try { setRemotePlaces(await onRemoteSearch(query.trim())); }
              catch (error) { setRemoteError(error instanceof Error ? error.message : "搜索失败"); }
              finally { setLoading(false); }
            })(); }}>在地图服务中搜索“{query}”</button>
          )}
        </div>
      )}
    </div>
  );
}
