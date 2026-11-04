import { useMemo, useState } from "react";
import { Link, useSearch, useListResources, getListResourcesQueryKey } from "./_preview";
import { Search, X } from "lucide-react";
import { useSessionUser } from "./_shell";
import { ErrorPanel, ListSkeleton, ResourceRow, EmptyPanel } from "./_portal-ui";
import { areasForUser, AREA_STYLE, areaColor, groupName, matches, visibleResources } from "./_portal";
import { GroupFilter } from "./_group-filter";

export default function HomePage() {
  const { user } = useSessionUser();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const search = useSearch();
  const area = new URLSearchParams(search).get("area") || "All";
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true, refetchOnWindowFocus: true } });
  const visible = useMemo(() => visibleResources(list.data, user), [list.data, user]);
  const results = useMemo(() => visible.filter((r) => matches(r, q) && (group === "All" || groupName(r) === group) && (area === "All" || r.area === area)), [visible, q, group, area]);
  const recent = useMemo(() => [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [visible]);
  const first = user?.name.split(" ")[0];

  return (
    <div>
      <section className="rise relative -mx-4 mb-6 overflow-hidden bg-primary px-4 pb-6 pt-6 text-primary-foreground md:mx-0 md:rounded-xl md:px-8 md:pt-8">
        <div className="hazard absolute inset-x-0 bottom-0 h-1.5" />
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary-foreground/60">Shift ready · {user?.area}</div>
        <h1 className="mt-1 font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">
          What do you need,<br /><span className="text-accent">{first}?</span>
        </h1>
        <label className="mt-5 flex items-center gap-3 rounded-lg bg-card px-4 py-3.5 text-foreground shadow-lg focus-within:ring-2 focus-within:ring-accent">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SOPs, modules, templates"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            data-testid="input-search-home"
          />
          {q && <button onClick={() => setQ("")} aria-label="Clear" data-testid="button-clear-search"><X className="h-4 w-4" /></button>}
        </label>
      </section>

      <GroupFilter resources={visible} value={group} onChange={setGroup} />
      {q || group !== "All" || area !== "All" ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span>{area !== "All" ? area : group !== "All" ? group : "Search results"}</span>
            <Link href="/" onClick={() => {setQ("");setGroup("All");}} className="underline">Clear filters</Link>
          </div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{results.length} match{results.length === 1 ? "" : "es"}</div>
          {results.length ? (
            <div className="overflow-hidden rounded-lg border border-border">{results.map((r, i) => <ResourceRow key={r.id} r={r} index={i} />)}</div>
          ) : (
            <EmptyPanel title="Nothing on that shelf">Try an area name like "Packing" or a shorter word.</EmptyPanel>
          )}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-wide">Jump to an area</h2>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {areasForUser(user).map((a, i) => {
                const count = visible.filter((r) => r.area === a).length;
                return (
                  <Link
                    key={a}
                    href={`/?area=${encodeURIComponent(a)}`}
                    data-testid={`link-area-${a.toLowerCase()}`}
                    className="rise group relative overflow-hidden rounded-lg border border-border bg-card p-3.5 transition-transform active:scale-[0.98] md:hover:-translate-y-0.5"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: areaColor(a) }} />
                    <div className="font-mono text-[10px] font-semibold tracking-widest" style={{ color: areaColor(a) }}>{AREA_STYLE[a].code}</div>
                    <div className="font-display text-2xl font-bold uppercase leading-tight">{a}</div>
                    <div className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{AREA_STYLE[a].note}</div>
                    <div className="mt-2 font-mono text-[11px] text-muted-foreground">{list.isLoading ? "··" : `${count} items`}</div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">Recently added</h2>
              <Link href="/sops" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground" data-testid="link-all-sops">All SOPs</Link>
            </div>
            {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : recent.length ? (
              <div className="overflow-hidden rounded-lg border border-border">{recent.map((r, i) => <ResourceRow key={r.id} r={r} index={i} />)}</div>
            ) : <EmptyPanel title="Shelves are empty">New SOPs and modules will appear here.</EmptyPanel>}
          </section>
        </>
      )}
    </div>
  );
}
