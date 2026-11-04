import { TriangleAlert } from "lucide-react";

/** Always visible on each screen; safe device use is not a dismissible tip. */
export function SafetyNotice() {
  return (
    <aside className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950" role="note" aria-label="Safe device use" data-testid="safety-notice">
      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <strong className="block">Stop in a safe location before using your device.</strong>
        Do not use this portal while operating heavy machinery or while in the path of moving equipment.
      </div>
    </aside>
  );
}
