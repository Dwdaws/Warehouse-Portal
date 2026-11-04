import { useState } from "react";
import { Archive, Info, RefreshCw } from "lucide-react";
import { useGetViewingReport, getGetViewingReportQueryKey, type GetViewingReportParams } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { EmptyPanel, ErrorPanel, ListSkeleton, PageHead, Restricted } from "@/components/portal-ui";
import { isManager } from "@/lib/portal";

const fmt = (v: string) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const selectCls = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm font-medium";

export default function ViewingReportPage() {
  const { user } = useSessionUser();
  const [userId, setUserId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const params: GetViewingReportParams | undefined =
    userId || resourceId ? { ...(userId ? { userId } : {}), ...(resourceId ? { resourceId } : {}) } : undefined;
  const q = useGetViewingReport(params, {
    query: {
      queryKey: getGetViewingReportQueryKey(params),
      enabled: isManager(user),
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
      placeholderData: (prev) => prev,
    },
  });
  if (!isManager(user)) return <Restricted need="supervisor or manager" />;

  const data = q.data;
  const people = data?.people ?? [];
  const modules = data?.modules ?? [];
  const records = data?.records ?? [];
  const jobLevels = new Map(people.map(person => [person.id, person.jobLevel]));

  return (
    <div>
      <PageHead kicker="Supervisors & managers" title="Viewing Report">Who opened which e-learning page, from which registered browser, and how often.</PageHead>

      <div className="mb-5 flex gap-3 rounded-lg border border-accent/60 bg-accent/10 p-3 text-sm" data-testid="text-report-disclaimer">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Counts are <strong>page opens only</strong> &mdash; not proof the module was watched or completed. Each registered browser is linked to the employee signed in on it;
          shared phones and cleared browser cookies can affect attribution. The browser ID is a random identifier stored by the portal, not a hardware or location record.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Person</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={selectCls} data-testid="select-person">
            <option value="">All people</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.employeeId} · {p.jobLevel}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Module</span>
          <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className={selectCls} data-testid="select-module">
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}{m.archived ? " (archived)" : ""}</option>
            ))}
          </select>
        </label>
        <button onClick={() => q.refetch()} disabled={q.isFetching} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-refresh-report">
          <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {q.isLoading ? <ListSkeleton /> : q.isError && !data ? <ErrorPanel onRetry={() => q.refetch()} message="Couldn't load the viewing report." /> : records.length === 0 ? (
        <EmptyPanel title="No page opens recorded">{params ? "Nothing matches these filters yet." : "Records appear here once someone opens an e-learning module page."}</EmptyPanel>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[1.3fr_1.4fr_0.9fr_0.5fr_1.6fr] gap-3 border-b border-border bg-secondary px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
            <span>Person</span><span>Module</span><span>Browser</span><span className="text-right">Opens</span><span>First / last opened</span>
          </div>
          {records.map((r, i) => (
            <div key={`${r.userId}-${r.resourceId}-${r.deviceId}`} className="rise grid gap-2 border-b border-border px-4 py-3 last:border-0 md:grid-cols-[1.3fr_1.4fr_0.9fr_0.5fr_1.6fr] md:items-center md:gap-3" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} data-testid={`row-view-${i}`}>
              <div className="min-w-0">
                <div className="truncate font-semibold">{r.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.employeeId}
                  <span className="ml-1.5 rounded bg-secondary px-1 py-px text-secondary-foreground">{jobLevels.get(r.userId) || r.role}</span>
                </div>
              </div>
              <div className="min-w-0 text-sm">
                <span className="font-medium">{r.title}</span>
                {r.archived && <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px font-mono text-[10px] uppercase text-muted-foreground"><Archive className="h-3 w-3" />Archived</span>}
              </div>
              <div className="font-mono text-xs" title={`Browser ID: ${r.deviceId}`} data-testid={`text-device-${i}`}>
                <span className="text-muted-foreground md:hidden">Browser </span>{r.deviceId.slice(0, 8)}
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.role === "Manager" ? "Manager browser" : "Registered browser"}</div>
              </div>
              <div className="font-display text-2xl font-bold leading-none md:text-right" data-testid={`text-count-${i}`}>
                {r.viewCount}<span className="ml-1 font-mono text-[10px] font-normal uppercase text-muted-foreground md:hidden">opens</span>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                <div>First {fmt(r.firstViewedAt)}</div>
                <div className="text-foreground">Last {fmt(r.lastViewedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {q.isError && data && <p className="mt-3 text-xs text-destructive">Latest refresh failed; showing previous data.</p>}
    </div>
  );
}
