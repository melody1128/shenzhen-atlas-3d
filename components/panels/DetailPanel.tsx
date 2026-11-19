"use client";

import { useMemo, useRef, useState } from "react";
import { Bookmark, Check, ChevronRight, CircleDollarSign, ExternalLink, Flag, LoaderCircle, MapPin, Navigation, X } from "lucide-react";
import { CURATED_PLACE_BY_ID } from "@/data/places";
import { DISTRICT_BY_ID, STREET_BY_ID } from "@/data/districts";
import { COMMUNITY_SOURCE, communitiesOfStreet } from "@/data/communities";
import { formatPrice, latestPriceForTarget } from "@/data/prices";
import { formatDistance } from "@/lib/geo/distance";
import { useAtlasStore, type ExploreTarget } from "@/lib/store/atlas-store";
import type { AtlasPlace, CuratedPlace, District, NearbyPlace, PlaceCategory, Street } from "@/types/atlas";
import type { AtlasSelection } from "@/types/selection";

interface DetailPanelProps {
  selection: AtlasSelection;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
  onStreetSelect: (street: Street) => void;
  onCommunitySelect: (street: Street, communityName: string) => void;
  onPlaceSelect: (place: AtlasPlace) => void;
  onNearby: (origin: AtlasPlace, keyword: string, category: PlaceCategory) => Promise<NearbyPlace[]>;
}

interface NearbyGroup {
  label: string;
  items: NearbyPlace[];
}

interface SelectionDetails {
  id: string;
  name: string;
  category: string;
  districtName: string;
  kind: AtlasSelection["kind"];
  district?: District;
  street?: Street;
  curated?: CuratedPlace;
  place?: AtlasPlace;
  loading: boolean;
  error: string;
}

export function DetailPanel({ selection, expanded, onToggleExpanded, onClose, onStreetSelect, onCommunitySelect, onPlaceSelect, onNearby }: DetailPanelProps) {
  const [nearby, setNearby] = useState<NearbyGroup[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const dragStart = useRef<number | null>(null);
  const { records, toggleKnown, toggleFavorite, toggleWishlist } = useAtlasStore();

  const details = useMemo<SelectionDetails | null>(() => {
    if (selection.kind === "district") {
      const district = DISTRICT_BY_ID.get(selection.districtId);
      return district ? { id: district.id, name: district.name, category: district.kind, districtName: district.name, kind: selection.kind, district, place: undefined, loading: false, error: "" } : null;
    }
    if (selection.kind === "street") {
      const street = STREET_BY_ID.get(selection.streetId);
      const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
      return street && district ? { id: street.id, name: street.name, category: "街道", districtName: district.name, kind: selection.kind, district, street, place: selection.resolvedPlace, loading: selection.resolving, error: selection.error ?? "" } : null;
    }
    if (selection.kind === "curated") {
      const curated = CURATED_PLACE_BY_ID.get(selection.curatedId);
      const district = curated ? DISTRICT_BY_ID.get(curated.districtId) : undefined;
      return curated && district ? { id: curated.id, name: curated.name, category: curated.category, districtName: district.name, kind: selection.kind, district, curated, place: selection.place, loading: selection.resolving, error: selection.error ?? "" } : null;
    }
    if (selection.kind === "community") {
      const street = STREET_BY_ID.get(selection.streetId);
      const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
      return street && district
        ? { id: `${street.id}:${selection.communityName}`, name: selection.communityName, category: "社区", districtName: district.name, kind: selection.kind, district, street, place: selection.place, loading: selection.resolving, error: selection.error ?? "" }
        : null;
    }
    const district = Array.from(DISTRICT_BY_ID.values()).find((item) => selection.place.districtName.includes(item.name.replace(/区|新区/g, "")));
    return { id: selection.place.id, name: selection.place.name, category: selection.place.category, districtName: selection.place.districtName, kind: selection.kind, district, place: selection.place, loading: false, error: "" };
  }, [selection]);

  if (!details) return null;
  const target: ExploreTarget = { id: details.id, name: details.name, category: details.category, districtName: details.districtName, place: details.place };
  const record = records[details.id];
  const price = latestPriceForTarget(details.id);

  const loadNearby = async () => {
    if (!details.place) return;
    setNearbyLoading(true);
    setNearbyError("");
    try {
      const groups = await Promise.all([
        { label: "地铁站", keyword: "地铁站", category: "地铁站" as PlaceCategory },
        { label: "商场", keyword: "购物中心", category: "购物中心" as PlaceCategory },
        { label: "公园", keyword: "公园", category: "公园" as PlaceCategory },
        { label: "医院", keyword: "医院", category: "医院" as PlaceCategory },
      ].map(async (group) => ({ label: group.label, items: await onNearby(details.place as AtlasPlace, group.keyword, group.category) })));
      setNearby(groups);
    } catch (error) {
      setNearbyError(error instanceof Error ? error.message : "周边查询失败");
    } finally {
      setNearbyLoading(false);
    }
  };

  return (
    <aside
      className={`detail-panel ${expanded ? "expanded" : ""}`}
      aria-label={`${details.name}详情`}
      onPointerDown={(event) => { if ((event.target as HTMLElement).closest(".sheet-drag-handle")) dragStart.current = event.clientY; }}
      onPointerUp={(event) => {
        if (dragStart.current === null) return;
        const delta = event.clientY - dragStart.current;
        if (delta < -36 && !expanded) onToggleExpanded();
        if (delta > 42 && expanded) onToggleExpanded();
        else if (delta > 80 && !expanded) onClose();
        dragStart.current = null;
      }}
    >
      <button className="sheet-drag-handle" type="button" onClick={onToggleExpanded} aria-label={expanded ? "收起详情" : "展开详情"}><span /></button>
      <div className="detail-topline">
        <span className="detail-category">{details.category}</span>
        <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="关闭详情"><X size={18} /></button>
      </div>
      <div className="detail-scroll">
        <header className="detail-header">
          <span className="eyebrow">SHENZHEN / {details.district?.id.toUpperCase() ?? "PLACE"}</span>
          <h1>{details.name}</h1>
          <div className="breadcrumb"><span>深圳市</span><ChevronRight size={12} /><span>{details.districtName}</span>{details.category === "社区" && <><ChevronRight size={12} /><span>社区</span></>}</div>
        </header>

        <div className="exploration-actions">
          <button type="button" className={record?.status === "已了解" ? "active" : ""} onClick={() => toggleKnown(target)}><Check size={15} />{record?.status === "已了解" ? "已了解" : "标记已了解"}</button>
          <button type="button" className={record?.favorite ? "active" : ""} onClick={() => toggleFavorite(target)}><Bookmark size={15} />{record?.favorite ? "已收藏" : "收藏"}</button>
          <button type="button" className={record?.wishlist ? "active" : ""} onClick={() => toggleWishlist(target)}><Flag size={15} />{record?.wishlist ? "已加入" : "想去"}</button>
        </div>

        {details.loading && <div className="detail-loading"><LoaderCircle className="spin" size={18} /><span>正在通过真实地图核验位置与地址…</span></div>}
        {details.error && <div className="data-warning">{details.error}</div>}

        <section className="detail-section">
          <h2>区域与位置</h2>
          {details.kind === "district" && details.district && (
            <div className="fact-grid">
              <div><span>区域性质</span><strong>{details.district.kind}</strong></div>
              <div><span>下辖街道</span><strong>{details.district.streets.length} 个</strong></div>
            </div>
          )}
          {details.kind === "street" && <div className="boundary-status"><MapPin size={16} /><span><strong>精确边界数据暂缺</strong><small>地图定位点为检索到的街道相关真实地点，不是行政边界。</small></span></div>}
          {details.kind === "community" && <div className="boundary-status"><MapPin size={16} /><span><strong>社区边界数据暂缺</strong><small>定位为地图检索的社区工作站/居委会位置，社区范围不绘制示意边界。</small></span></div>}
          {details.place && (
            <dl className="place-facts">
              <div><dt>地图地址</dt><dd>{details.place.address || "地图服务未返回详细地址"}</dd></div>
              <div><dt>坐标</dt><dd>{details.place.location.lng.toFixed(5)}, {details.place.location.lat.toFixed(5)} <small>GCJ-02</small></dd></div>
              {details.place.phone && <div><dt>联系电话</dt><dd>{details.place.phone}</dd></div>}
              {details.place.rawType && <div><dt>地图分类</dt><dd>{details.place.rawType}</dd></div>}
            </dl>
          )}
          {!details.place && !details.loading && details.kind !== "district" && <p className="muted-copy">配置并连接真实地图后，可查询该地名的位置与地址。</p>}
        </section>

        <section className="detail-section price-section">
          <div className="section-title-row"><h2>二手普通住宅成交均价</h2><CircleDollarSign size={17} /></div>
          <strong className="price-value">{formatPrice(price?.price)}</strong>
          {price ? <p>统计至 {price.periodEnd} · {price.sampleSize ? `${price.sampleSize} 套样本 · ` : ""}{price.source.name}</p> : <p>未混入挂牌价、官方参考价、公寓或别墅数据。</p>}
        </section>

        {details.street && (() => {
          const communityList = communitiesOfStreet(details.street.name) ?? [];
          return (
            <section className="detail-section">
              <div className="section-title-row"><h2>社区目录 <span>{communityList.length}</span></h2></div>
              {communityList.length ? (
                <>
                  <div className="detail-street-grid community-grid">
                    {communityList.map((community) => (
                      <button type="button" key={community} onClick={() => onCommunitySelect(details.street as Street, community)}>
                        {community.replace(/居委会|社区居委会/g, "")}<ChevronRight size={13} />
                      </button>
                    ))}
                  </div>
                  <p className="muted-copy">来源：{COMMUNITY_SOURCE.name}（{COMMUNITY_SOURCE.statisticsYear} 年统计口径），基层调整可能与现状略有差异。</p>
                </>
              ) : (
                <p className="muted-copy">该街道的社区名录暂未收录完整可靠数据，不做猜测。</p>
              )}
            </section>
          );
        })()}
        {details.kind === "district" && details.district && (
          <section className="detail-section">
            <h2>街道目录 <span>{details.district.streets.length}</span></h2>
            <div className="detail-street-grid">
              {details.district.streets.map((street) => <button type="button" key={street.id} onClick={() => onStreetSelect(street)}>{street.name}<ChevronRight size={13} /></button>)}
            </div>
          </section>
        )}

        {details.place && (
          <section className="detail-section">
            <div className="section-title-row"><h2>周边 1.5 公里</h2><Navigation size={16} /></div>
            <p className="muted-copy">按需检索；距离为球面直线距离，不是步行或驾车路线。</p>
            <button className="secondary-button full-width" type="button" onClick={() => void loadNearby()} disabled={nearbyLoading}>
              {nearbyLoading ? <LoaderCircle className="spin" size={15} /> : <Navigation size={15} />}{nearby.length ? "重新查询周边" : "查询周边设施"}
            </button>
            {nearbyError && <div className="data-warning">{nearbyError}</div>}
            {nearby.map((group) => group.items.length > 0 && (
              <div className="nearby-group" key={group.label}><h3>{group.label}</h3>
                {group.items.map(({ place, straightLineDistance }) => (
                  <button type="button" key={place.id} onClick={() => onPlaceSelect(place)}><span>{place.name}<small>{place.address}</small></span><strong>{formatDistance(straightLineDistance)}</strong></button>
                ))}
              </div>
            ))}
            {nearby.length > 0 && nearby.every((group) => !group.items.length) && <p className="empty-copy">当前检索未返回周边设施，不代表该范围实际没有。</p>}
          </section>
        )}

        <section className="detail-section media-empty">
          <h2>实景与影像</h2>
          <div><span>尚未接入经授权且能核实拍摄时间的实景资料</span><small>不使用无来源图片或旧照片冒充现状</small></div>
        </section>

        <section className="detail-sources">
          <span>数据来源</span>
          {details.district && <a href={details.district.source.url} target="_blank" rel="noreferrer">深圳市民政局 · 行政区划目录 <ExternalLink size={12} /></a>}
          {details.place && <a href={details.place.source.url} target="_blank" rel="noreferrer">{details.place.source.name} · {new Date(details.place.updatedAt).toLocaleDateString("zh-CN")} <ExternalLink size={12} /></a>}
          <small>地点详情由地图检索实时返回；目录完整性与字段缺失情况见数据源说明。</small>
        </section>
      </div>
    </aside>
  );
}
