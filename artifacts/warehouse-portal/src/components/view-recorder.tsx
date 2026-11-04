import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { useRecordLearningView, getGetViewingReportQueryKey } from "@workspace/api-client-react";

// Event IDs already sent in this tab; guards StrictMode double effects.
const sent = new Set<string>();

/** Mount with key={`${userId}:${resourceId}`} so each visit/user/module gets a fresh event ID. */
export function ViewRecorder({ resourceId }: { resourceId: string }) {
  const [eventId] = useState(() => crypto.randomUUID());
  const qc = useQueryClient();
  const rec = useRecordLearningView({
    mutation: {
      retry: 1,
      onSuccess: () => qc.invalidateQueries({ queryKey: [getGetViewingReportQueryKey()[0]] }),
    },
  });
  const mutateRef = useRef(rec.mutate);
  mutateRef.current = rec.mutate;

  useEffect(() => {
    if (sent.has(eventId)) return;
    sent.add(eventId);
    mutateRef.current({ data: { resourceId, eventId } });
  }, [eventId, resourceId]);

  const base = "mb-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider";
  if (rec.isError) {
    return (
      <div className={`${base} border-destructive/40 text-destructive`} data-testid="status-view-record" role="status">
        <TriangleAlert className="h-3.5 w-3.5" /> Page open not recorded
        <button onClick={() => rec.mutate({ data: { resourceId, eventId } })} className="ml-1 inline-flex items-center gap-1 rounded border border-destructive/40 px-1.5 py-0.5 hover:bg-destructive/10" data-testid="button-retry-record">
          <RotateCcw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }
  if (rec.isSuccess) {
    return (
      <div className={`${base} border-border text-muted-foreground`} data-testid="status-view-record" role="status" title="Records that this page was opened. It does not confirm watching or completion.">
        <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(150_50%_32%)]" /> Page open recorded
      </div>
    );
  }
  return (
    <div className={`${base} border-border text-muted-foreground`} data-testid="status-view-record" role="status">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording page open
    </div>
  );
}
