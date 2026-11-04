import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, ExternalLink, Pencil, Users } from "lucide-react";
import { useListResources, getListResourcesQueryKey } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { AreaTag, EmptyPanel, ErrorPanel, ListSkeleton } from "@/components/portal-ui";
import { canSee, isEditor } from "@/lib/portal";
import { ViewRecorder } from "@/components/view-recorder";

export default function LearningDetailPage() {
  const { id } = useParams();
  const { user } = useSessionUser();
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const r = list.data?.find((x) => x.id === id && x.kind === "learning");

  if (list.isLoading) return <ListSkeleton rows={3} />;
  if (list.isError) return <ErrorPanel onRetry={() => list.refetch()} />;
  if (!r || !canSee(r, user)) return <EmptyPanel title="Module not found">It may be archived or limited to managers. <Link href="/learnings" className="underline">Back</Link></EmptyPanel>;

  const link = r.shareUrl?.startsWith("https://") ? r.shareUrl : "";

  return (
    <div className="rise">
      <Link href="/learnings" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground" data-testid="link-back">
        <ArrowLeft className="h-3.5 w-3.5" /> E-Learnings
      </Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <AreaTag area={r.area} />
          <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-none md:text-4xl" data-testid="text-learning-title">{r.title}</h1>
          <div className="mt-2 flex gap-4 font-mono text-xs text-muted-foreground">
            {r.minutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{r.minutes} min</span> : null}
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r.audience}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {link ? (
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-open-new-tab">
              <ExternalLink className="h-4 w-4" /> Open in new tab
            </a>
          ) : (
            <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground" data-testid="button-open-new-tab" title="No MeetQuinn link yet">
              <ExternalLink className="h-4 w-4" /> Open in new tab
            </button>
          )}
          {isEditor(user) && (
            <Link href={`/admin?edit=${r.id}`} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold" data-testid="link-edit"><Pencil className="h-4 w-4" /> Edit</Link>
          )}
        </div>
      </div>
      <ViewRecorder key={`${user?.id}:${r.id}`} resourceId={r.id} />
      {r.description && <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{r.description}</p>}
      {link ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card" style={{ aspectRatio: "16 / 10" }}>
          <iframe src={link} title={r.title} className="absolute inset-0 h-full w-full" allow="fullscreen; autoplay; clipboard-write" allowFullScreen data-testid="iframe-learning" />
        </div>
      ) : (
        <EmptyPanel title="Demo module needs a MeetQuinn link">
          This is a placeholder module. {isEditor(user) ? "Edit it and paste the actual https:// MeetQuinn share URL to embed it here." : "A content editor needs to add the MeetQuinn share URL."}
        </EmptyPanel>
      )}
    </div>
  );
}
