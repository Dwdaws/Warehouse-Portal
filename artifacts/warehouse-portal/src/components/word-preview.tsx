import { useGetWordPreview, getGetWordPreviewQueryKey } from "@workspace/api-client-react";
import { Loader2, RotateCcw } from "lucide-react";

const viewerHtml = (html: string) => `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<style>
body{box-sizing:border-box;margin:0;padding:clamp(16px,4vw,40px);font:16px/1.65 system-ui,sans-serif;color:#192737;background:#fff;overflow-wrap:anywhere}
h1,h2,h3,h4{line-height:1.25;margin-top:1.5em}
img{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%;display:block;overflow-x:auto}
td,th{border:1px solid #cbd0d5;padding:8px;vertical-align:top}th{background:#f0f2f4}
pre{font:inherit;white-space:pre-wrap}li{margin:.4em 0}blockquote{border-left:3px solid #cbd0d5;padding-left:16px;margin-left:0}
</style></head><body>${html}</body></html>`;

export function WordPreview({ resourceId, title, revision }: { resourceId: string; title: string; revision: string }) {
  const preview = useGetWordPreview(resourceId, {
    query: {
      queryKey: [...getGetWordPreviewQueryKey(resourceId), revision],
      refetchOnMount: true,
      retry: false,
    },
  });
  return (
    <section aria-label="Word document preview" className="overflow-hidden rounded-lg border border-border bg-card" data-testid="word-preview">
      <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Read in the app</strong>
        <p className="mt-1">
          {preview.data?.format === "doc"
            ? "Text-only preview of an older Word file. Images and layout are not included."
            : "A reading preview of the Word document. Complex layout may differ from the original."}
          {" "}Download the original for exact formatting, or use a PDF for consistent layout.
        </p>
      </div>
      {preview.isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Preparing document preview…</div>
      ) : preview.isError ? (
        <div className="p-5 text-sm" role="alert">
          <p>We couldn’t display this document. You can still download the original above, or ask an editor for a PDF version.</p>
          <button type="button" onClick={() => preview.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-semibold" data-testid="button-retry-word-preview">
            <RotateCcw className="h-4 w-4" /> Retry preview
          </button>
        </div>
      ) : preview.data ? (
        <iframe
          title={`${title} — Word reading preview`}
          srcDoc={viewerHtml(preview.data.html)}
          sandbox=""
          className="h-[75dvh] min-h-96 w-full bg-white"
          data-testid="iframe-word-preview"
        />
      ) : null}
    </section>
  );
}
