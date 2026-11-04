import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Search } from "lucide-react";
import { useListResources, getListResourcesQueryKey } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { EmptyPanel, ErrorPanel, ListSkeleton, PageHead } from "@/components/portal-ui";
import { GroupedResources } from "@/components/grouped-resources";
import { areasForUser, areaColor, groupName, isEditor, isStale, matches, visibleResources } from "@/lib/portal";
import { GroupFilter } from "@/components/group-filter";

export function AreaFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { user } = useSessionUser();
  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {["All", ...areasForUser(user)].map((a) => {
        const on = value === a;
        return (
          <button
            key={a}
            onClick={() => onChange(a)}
            data-testid={`filter-area-${a.toLowerCase()}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${on ? "border-transparent text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
            style={on ? { background: a === "All" ? "hsl(var(--primary))" : areaColor(a) } : undefined}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="mb-3 flex items-center gap-3 rounded-lg border border-input bg-card px-3.5 py-3 focus-within:ring-2 focus-within:ring-ring">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none" data-testid="input-search" />
    </label>
  );
}

export default function SopsPage() {
  const { user } = useSessionUser();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const area = new URLSearchParams(search).get("area") || "All";
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [staleOnly, setStaleOnly] = useState(false);
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const editor = isEditor(user);
  const sops = useMemo(() => visibleResources(list.data, user).filter((r) => r.kind === "sop"), [list.data, user]);
  const shown = sops
    .filter((r) => (area === "All" || r.area === area) && (group === "All" || groupName(r) === group) && matches(r, q) && (!staleOnly || isStale(r)))
    .sort((a, b) => a.title.localeCompare(b.title));
  const staleCount = sops.filter(isStale).length;

  return (
    <div>
      <PageHead kicker="Standard operating procedures" title="SOP Library">Open on any phone. Every SOP has its own link and QR code.</PageHead>
      <SearchBox value={q} onChange={setQ} placeholder="Search by title, owner, keyword" />
      <AreaFilter value={area} onChange={(a) => setLocation(a === "All" ? "/sops" : `/sops?area=${encodeURIComponent(a)}`)} />
      <GroupFilter resources={sops} value={group} onChange={setGroup} />
      {editor && staleCount > 0 && (
        <button
          onClick={() => setStaleOnly((s) => !s)}
          data-testid="button-toggle-stale"
          className={`mb-4 flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${staleOnly ? "border-accent bg-accent text-accent-foreground" : "border-accent/60 bg-accent/15"}`}
        >
          <span><b>{staleCount}</b> SOP{staleCount > 1 ? "s" : ""} not reviewed in 12+ months</span>
          <span className="font-mono text-[11px] uppercase tracking-wider">{staleOnly ? "Show all" : "Show only"}</span>
        </button>
      )}
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : shown.length ? (
        <GroupedResources resources={shown} showStale={editor} />
      ) : <EmptyPanel title="No SOPs here">{area !== "All" ? `Nothing filed under ${area} matches.` : "Try a different search."}</EmptyPanel>}
    </div>
  );
}
