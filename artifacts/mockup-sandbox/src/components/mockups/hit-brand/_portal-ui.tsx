import type { ReactNode } from "react";
import { Link } from "./_preview";
import { AlertTriangle, ChevronRight, FileText, Lock, PlayCircle, RefreshCw, Wrench } from "lucide-react";
import type { Resource } from "./_preview";
import { AREA_STYLE, KIND_LABEL, areaColor, fmtDate, isStale, resourceHref } from "./_portal";

export function AreaTag({ area }: { area: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: areaColor(area, 0.12), color: areaColor(area) }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: areaColor(area) }} />
      {area}
    </span>
  );
}

export function StaleFlag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent-foreground" data-testid="flag-stale">
      <AlertTriangle className="h-3 w-3" /> Review due
    </span>
  );
}

const KIND_ICON = { sop: FileText, learning: PlayCircle, toolkit: Wrench } as const;

export function ResourceRow({ r, showStale, index = 0 }: { r: Resource; showStale?: boolean; index?: number }) {
  const Icon = KIND_ICON[r.kind];
  return (
    <Link
      href={resourceHref(r)}
      data-testid={`link-resource-${r.id}`}
      className="rise group flex items-center gap-3 border-b border-border bg-card px-4 py-3.5 transition-colors last:border-b-0 hover:bg-secondary/60 active:bg-secondary"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms`, boxShadow: `inset 4px 0 0 ${areaColor(r.area)}` }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md" style={{ background: areaColor(r.area, 0.1), color: areaColor(r.area) }}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold leading-tight">{r.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <AreaTag area={r.area} />
          {r.contentGroup && <span>{r.contentGroup}</span>}
          <span className="font-mono uppercase">{KIND_LABEL[r.kind]}</span>
          {r.version && <span className="font-mono">v{r.version}</span>}
          {r.minutes ? <span className="font-mono">{r.minutes} min</span> : null}
          {showStale && isStale(r) && <StaleFlag />}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="rise mb-5">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{kicker}</div>
      <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight md:text-5xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0">
          <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorPanel({ onRetry, message = "Couldn't reach the portal." }: { onRetry: () => void; message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
      <div className="font-semibold text-destructive">{message}</div>
      <p className="mt-1 text-muted-foreground">Check the floor Wi-Fi and try again.</p>
      <button onClick={onRetry} data-testid="button-retry" className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

export function EmptyPanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-input bg-card/60 px-5 py-10 text-center">
      <div className="hazard absolute inset-x-0 top-0 h-1 opacity-70" />
      <div className="font-display text-2xl font-bold uppercase">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Restricted({ need }: { need: string }) {
  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hazard h-2" />
        <div className="p-6">
          <Lock className="h-6 w-6" />
          <div className="mt-3 font-display text-3xl font-bold uppercase">Authorized only</div>
          <p className="mt-1 text-sm text-muted-foreground">This area requires {need} access. Switch accounts if you have it.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground" data-testid="link-home">Back home</Link>
            <Link href="/login" className="rounded-md border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider" data-testid="link-switch">Switch account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetaCell({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="border-b border-r border-border p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value || "—"}</div>
    </div>
  );
}

export { fmtDate, AREA_STYLE };
