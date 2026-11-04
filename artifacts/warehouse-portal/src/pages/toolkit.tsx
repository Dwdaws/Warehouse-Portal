import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BarChart3, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useListResources, getListResourcesQueryKey, type Resource } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { EmptyPanel, ErrorPanel, ListSkeleton, PageHead, Restricted } from "@/components/portal-ui";
import { fmtDate, groupName, isManager, visibleResources } from "@/lib/portal";
import { GroupFilter } from "@/components/group-filter";
import { AreaFilter } from "@/pages/sops";

function ToolCard({ r, i }: { r: Resource; i: number }) {
  const xl = /\.xlsx?$/i.test(r.fileName ?? r.fileUrl ?? "");
  const Icon = xl ? FileSpreadsheet : FileText;
  return (
    <div className="rise flex flex-col rounded-lg border border-border bg-card p-4" style={{ animationDelay: `${i * 50}ms` }} data-testid={`card-toolkit-${r.id}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${xl ? "bg-[hsl(150_50%_32%/.12)] text-[hsl(150_50%_30%)]" : "bg-[hsl(205_70%_42%/.12)] text-[hsl(205_70%_38%)]"}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="font-semibold leading-tight">{r.title}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{xl ? "Excel" : "Word"} · Last updated {fmtDate(r.updatedAt)}</div>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{r.description}</p>
      {r.contentGroup && <div className="mt-2 text-xs font-semibold text-muted-foreground">{r.contentGroup}</div>}
      {r.fileUrl ? (
        <a href={r.fileUrl} download={r.fileName} className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-transform active:scale-[0.98]" data-testid={`button-download-${r.id}`}>
          <Download className="h-4 w-4" /> Download blank
        </a>
      ) : <div className="mt-4 rounded-md bg-muted px-3 py-2.5 text-center text-xs text-muted-foreground">No file uploaded yet</div>}
    </div>
  );
}

export default function ToolkitPage() {
  const { user } = useSessionUser();
  const [group, setGroup] = useState("All");
  const [area, setArea] = useState("All");
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const items = useMemo(() => visibleResources(list.data, user).filter((r) => r.kind === "toolkit"), [list.data, user]);
  const filtered = items.filter(r => (group === "All" || groupName(r) === group) && (area === "All" || r.area === area));
  if (!isManager(user)) return <Restricted need="manager" />;
  const isAssess = (r: Resource) => /assess|30-60-90/i.test(`${r.category} ${r.title}`);
  const groups = [
    { title: "Meeting Templates", sub: "1-on-1 and team meetings · Word", items: filtered.filter((r) => !isAssess(r)) },
    { title: "30-60-90 Assessments", sub: "New-hire check-ins · Excel", items: filtered.filter(isAssess) },
  ];
  return (
    <div>
      <PageHead kicker="Managers only" title="Manager Toolkit">Blank master copies. Save completed files on your own computer; the portal only keeps the current template.</PageHead>
      <Link href="/viewing-report" className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-secondary" data-testid="link-viewing-report">
        <BarChart3 className="h-5 w-5" />
        <div><div className="font-semibold">E-learning viewing report</div><div className="text-xs text-muted-foreground">Page opens by person, module and browser</div></div>
      </Link>
      <AreaFilter value={area} onChange={setArea} />
      <GroupFilter resources={items} value={group} onChange={setGroup} />
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : groups.map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="font-display text-2xl font-bold uppercase">{g.title}</h2>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{g.sub}</div>
          {g.items.length ? <div className="grid gap-3 md:grid-cols-2">{g.items.map((r, i) => <ToolCard key={r.id} r={r} i={i} />)}</div> : <EmptyPanel title="None yet" />}
        </section>
      ))}
    </div>
  );
}
