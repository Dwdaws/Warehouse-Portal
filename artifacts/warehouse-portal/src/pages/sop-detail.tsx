import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Download, ExternalLink, Pencil, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useListResources, getListResourcesQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSessionUser } from "@/components/shell";
import { AreaTag, EmptyPanel, ErrorPanel, ListSkeleton, MetaCell, StaleFlag } from "@/components/portal-ui";
import { areaColor, canSee, fmtDate, isEditor, isPdf, isStale } from "@/lib/portal";
import { WordPreview } from "@/components/word-preview";

export default function SopDetailPage() {
  const { id } = useParams();
  const { user } = useSessionUser();
  const [qrOpen, setQrOpen] = useState(false);
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const r = list.data?.find((x) => x.id === id && x.kind === "sop");
  const editor = isEditor(user);

  if (list.isLoading) return <ListSkeleton rows={3} />;
  if (list.isError) return <ErrorPanel onRetry={() => list.refetch()} />;
  if (!r || !canSee(r, user)) return <EmptyPanel title="SOP not found">It may have been archived or moved. <Link href="/sops" className="underline">Back to library</Link></EmptyPanel>;

  const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/sops/${r.id}`;

  return (
    <div className="rise">
      <Link href="/sops" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground" data-testid="link-back">
        <ArrowLeft className="h-3.5 w-3.5" /> SOP Library
      </Link>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-2" style={{ background: areaColor(r.area) }} />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2"><AreaTag area={r.area} />{editor && isStale(r) && <StaleFlag />}</div>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-none md:text-4xl" data-testid="text-sop-title">{r.title}</h1>
          {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
        </div>
        <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
          <MetaCell label="Owner" value={r.owner} />
          <MetaCell label="Version" value={r.version && <span className="font-mono">v{r.version}</span>} />
          <MetaCell label="Effective" value={fmtDate(r.effectiveDate)} />
          <MetaCell label="Last reviewed" value={fmtDate(r.lastReviewed)} />
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {r.fileUrl && (
            <a href={r.fileUrl} download={r.fileName} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground md:flex-none" data-testid="button-download">
              <Download className="h-4 w-4" /> Download
            </a>
          )}
          {r.fileUrl && isPdf(r) && (
            <a href={r.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold" data-testid="button-open-pdf">
              <ExternalLink className="h-4 w-4" /> Full screen
            </a>
          )}
          {editor && (
            <>
              <button onClick={() => setQrOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground" data-testid="button-qr">
                <QrCode className="h-4 w-4" /> Print QR
              </button>
              <Link href={`/admin?edit=${r.id}`} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold" data-testid="link-edit">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        {!r.fileUrl ? (
          <EmptyPanel title="No file attached">An editor needs to upload this SOP's document.</EmptyPanel>
        ) : isPdf(r) ? (
          <iframe src={r.fileUrl} title={r.title} className="h-[75dvh] w-full rounded-lg border border-border bg-card" data-testid="iframe-pdf" />
        ) : /\.docx?$/i.test(r.fileName || "") ? (
          <WordPreview key={r.id} resourceId={r.id} title={r.title} revision={r.updatedAt} />
        ) : (
          <EmptyPanel title="Preview unavailable">Use Download to open {r.fileName || "this document"}.</EmptyPanel>
        )}
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="font-display text-2xl uppercase">Workstation QR</DialogTitle>
          <div className="print-area">
            <div className="w-full rounded-lg border-2 border-foreground bg-white p-5 text-center text-[#1a2233]">
              <div className="mb-3 h-2" style={{ background: areaColor(r.area) }} />
              <div className="font-mono text-[10px] uppercase tracking-[0.25em]">{r.area} · SOP</div>
              <div className="mb-3 font-display text-2xl font-bold uppercase leading-tight">{r.title}</div>
              <QRCodeSVG value={url} size={200} className="mx-auto" />
              <div className="mt-3 font-mono text-[10px]">Scan with your phone camera{r.version ? ` · v${r.version}` : ""}</div>
            </div>
          </div>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-print-qr">
            <Printer className="h-4 w-4" /> Print
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
