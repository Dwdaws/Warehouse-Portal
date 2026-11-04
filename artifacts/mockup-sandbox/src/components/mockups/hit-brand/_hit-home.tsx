import { useMemo, useState } from "react";
import { Link, useSearch, useListResources, getListResourcesQueryKey } from "./_preview";
import { Search, X, ChevronRight, FileText, PlayCircle, Wrench, MapPin, BookOpen, PackageCheck, ClipboardList, Boxes, ShieldCheck, Warehouse, Truck, Smartphone, Users } from "lucide-react";
import { useHitSession } from "./_hit-shell";
import { areasForUser, groupName, matches, visibleResources, contentGroups, isManager } from "./_portal";
import type { Resource } from "./_preview";

const AREA_DETAILS: Record<string, { icon: typeof MapPin; note: string }> = {
  Receiving: { icon: PackageCheck, note: "Dock-in, check-in, put-away" },
  Picking: { icon: ClipboardList, note: "Pick paths, scanners, totes" },
  Packing: { icon: Boxes, note: "Cartons, protection, final checks" },
  Shipping: { icon: Truck, note: "Labels, manifests, dispatch" },
  Inventory: { icon: Warehouse, note: "Counts, locations, adjustments" },
  Safety: { icon: ShieldCheck, note: "PPE, equipment, incident steps" },
  "Talent Management": { icon: Users, note: "Manager templates and references" },
};
const KIND_ICON = { sop: FileText, learning: PlayCircle, toolkit: Wrench } as const;
const KIND_LABEL = { sop: "SOP", learning: "E-learning", toolkit: "Template" } as const;
const resourceLink = (r: Resource) => r.kind === "sop" ? `/sops/${r.id}` : r.kind === "learning" ? `/learnings/${r.id}` : "/toolkit";

function ResourceItem({ resource }: { resource: Resource }) {
  const Icon = KIND_ICON[resource.kind];
  return (
    <Link href={resourceLink(resource)} data-testid={`link-resource-${resource.id}`} className="hit-resource-row">
      <span className="hit-resource-icon"><Icon aria-hidden="true" /></span>
      <span className="hit-resource-copy">
        <span className="hit-resource-title">{resource.title}</span>
        <span className="hit-resource-desc">{resource.description}</span>
        <span className="hit-resource-meta">
          <span className="hit-type-pill">{KIND_LABEL[resource.kind]}</span>
          <span>{resource.area}</span>
          {resource.contentGroup && <span>· {resource.contentGroup}</span>}
          {resource.minutes ? <span>· {resource.minutes} min</span> : null}
        </span>
      </span>
      <ChevronRight className="hit-resource-arrow" aria-hidden="true" />
    </Link>
  );
}

function ResourceSkeleton() {
  return <div className="hit-resource-list" aria-label="Loading resources">{Array.from({ length: 4 }, (_, i) => <div className="hit-skeleton-row" key={i}><div className="hit-skeleton-box" /><div className="hit-skeleton-lines"><i /><i /></div></div>)}</div>;
}

export function HitHome() {
  const { user } = useHitSession();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const search = useSearch();
  const area = new URLSearchParams(search).get("area") || "All";
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true, refetchOnWindowFocus: true } });
  const visible = useMemo(() => visibleResources(list.data, user), [list.data, user]);
  const results = useMemo(() => visible.filter((r) => matches(r, q) && (group === "All" || groupName(r) === group) && (area === "All" || r.area === area)), [visible, q, group, area]);
  const recent = useMemo(() => [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [visible]);
  const groups = useMemo(() => contentGroups(visible), [visible]);
  const first = user?.name.split(" ")[0] || "there";
  const filtering = !!q || group !== "All" || area !== "All";

  return (
    <>
      <div className="hit-topline">
        <span className="hit-topline-label"><span className="hit-location-dot" /> Shift reference <span aria-hidden="true">·</span> {user?.area}</span>
        {isManager(user) && <Link href="/register-device" className="hit-topline-link" data-testid="link-register-device"><Smartphone /> Register device</Link>}
      </div>
      <section className="hit-welcome">
        <div className="hit-kicker">Warehouse Portal · Quick reference</div>
        <h1>What do you need, {first}?</h1>
        <p>Find a process, refresh a skill, or get back to the next step in your shift.</p>
        <label className="hit-search-wrap">
          <Search aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SOPs, refreshers, templates" aria-label="Search warehouse resources" data-testid="input-search-home" />
          {q && <button type="button" className="hit-clear" onClick={() => setQ("")} aria-label="Clear search" data-testid="button-clear-search"><X /></button>}
        </label>
      </section>

      <label className="hit-filter-row">
        <span className="hit-filter-label">Narrow by content group</span>
        <select aria-label="Filter by content group" data-testid="filter-content-group" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="All">All content groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>

      {filtering ? (
        <section className="hit-section">
          <div className="hit-section-heading">
            <div><h2>{area !== "All" ? area : group !== "All" ? group : "Search results"}</h2><p>Find the reference that gets you moving again.</p></div>
            <Link href="/" className="hit-all-link" onClick={() => { setQ(""); setGroup("All"); }} data-testid="link-clear-filters">Clear filters</Link>
          </div>
          <div className="hit-result-summary" data-testid="text-result-count">{results.length} result{results.length === 1 ? "" : "s"}</div>
          {results.length ? <div className="hit-resource-list">{results.map((r) => <ResourceItem key={r.id} resource={r} />)}</div> : <div className="hit-panel"><div className="hit-panel-title">No matching references</div><p>Try a shorter search, another process name, or choose a different content group.</p></div>}
        </section>
      ) : (
        <>
          <section className="hit-section">
            <div className="hit-section-heading"><div><h2>Browse by area</h2><p>Open references for the work happening around you.</p></div></div>
            <div className="hit-area-grid">
              {areasForUser(user).map((name, i) => {
                const Icon = AREA_DETAILS[name]?.icon ?? MapPin;
                const count = visible.filter((r) => r.area === name).length;
                return <Link key={name} href={`/?area=${encodeURIComponent(name)}`} data-testid={`link-area-${name.toLowerCase()}`} className="hit-area-card" style={{ animationDelay: `${i * 45}ms` }}>
                  <span className="hit-area-icon"><Icon aria-hidden="true" /></span>
                  <span className="hit-area-copy"><span className="hit-area-name">{name}</span><span className="hit-area-note">{AREA_DETAILS[name]?.note}</span></span>
                  <span className="hit-area-count">{list.isLoading ? "…" : `${count}`}</span>
                </Link>;
              })}
            </div>
            {isManager(user) && <div className="hit-manager-strip">
              <div className="hit-manager-copy"><strong>Manager resources</strong><span>Templates for people conversations and device setup.</span></div>
              <div className="hit-manager-actions">
                <Link href="/toolkit" className="hit-manager-action" data-testid="link-talent-toolkit"><Users /> Talent templates</Link>
                <Link href="/register-device" className="hit-manager-action" data-testid="link-device-registration"><Smartphone /> Device setup</Link>
              </div>
            </div>}
          </section>
          <section className="hit-section">
            <div className="hit-section-heading">
              <div><h2>Recently added</h2><p>New and updated floor references.</p></div>
              <Link href="/sops" className="hit-all-link" data-testid="link-all-sops">Browse SOPs <ChevronRight /></Link>
            </div>
            {list.isLoading ? <ResourceSkeleton /> : list.isError ? <div className="hit-panel"><div className="hit-panel-title">Couldn't load references</div><p>Check the floor Wi-Fi and try again.</p><button className="hit-manager-action" onClick={() => list.refetch()} data-testid="button-retry">Retry</button></div> : recent.length ? (
              <div className="hit-resource-list">{recent.map((r) => <ResourceItem key={r.id} resource={r} />)}</div>
            ) : <div className="hit-panel"><div className="hit-panel-title">No references yet</div><p>New SOPs and short learning refreshers will appear here.</p></div>}
          </section>
        </>
      )}
      <footer className="hit-footer">For the work in front of you. Reference materials for Hit warehouse teams.</footer>
    </>
  );
}
