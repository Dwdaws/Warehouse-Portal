import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Pencil, Plus, Upload } from "lucide-react";
import {
  useListResources, getListResourcesQueryKey, useSaveResource, useRequestUploadUrl,
  type Resource, type ResourceInput,
} from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useSessionUser } from "@/components/shell";
import { AreaTag, EmptyPanel, ErrorPanel, ListSkeleton, PageHead, Restricted, StaleFlag } from "@/components/portal-ui";
import { ALL_AREAS, CONTENT_GROUPS, MANAGER_AREAS, KIND_LABEL, audienceLabel, contentGroups, groupName, fmtDate, isEditor, isStale, matches } from "@/lib/portal";
import { GroupFilter } from "@/components/group-filter";
import { SearchBox } from "@/pages/sops";

type Kind = "sop" | "learning" | "toolkit";
const ACCEPT: Record<string, string> = {
  sop: ".pdf,.doc,.docx",
  toolkit: ".doc,.docx,.xls,.xlsx",
};
const MAX = 20 * 1024 * 1024;

function toInput(r: Resource): ResourceInput {
  const { createdAt: _c, updatedAt: _u, ...rest } = r;
  return rest;
}

const blank = (kind: Kind): ResourceInput => ({
  kind, title: "", description: "", area: "Receiving", audience: kind === "toolkit" ? "Managers" : "Both",
  owner: "", contentGroup: "", version: kind === "sop" ? "1.0" : undefined, effectiveDate: "", lastReviewed: "", shareUrl: "", category: kind === "toolkit" ? "Meeting Templates" : undefined,
});

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Editor({ initial, onDone, groups }: { initial: ResourceInput; onDone: () => void; groups: string[] }) {
  const [f, setF] = useState<ResourceInput>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const save = useSaveResource();
  const reqUpload = useRequestUploadUrl();
  const { toast } = useToast();
  const set = <K extends keyof ResourceInput>(k: K, v: ResourceInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const hasFile = f.kind !== "learning";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.title.trim()) return setErr("Title is required.");
    if (hasFile && !file && !f.fileUrl) return setErr("Choose a document to upload.");
    if (f.kind === "learning" && !f.shareUrl?.trim()) return setErr("Add the MeetQuinn share link for this e-learning.");
    if (f.kind === "learning" && f.shareUrl && !f.shareUrl.startsWith("https://")) return setErr("MeetQuinn link must start with https://");
    setBusy(true);
    try {
      let data: ResourceInput = { ...f, contentGroup: f.contentGroup?.trim() || "", minutes: f.minutes ? Number(f.minutes) : undefined };
      if ((MANAGER_AREAS as readonly string[]).includes(data.area)) data.audience = "Managers";
      if (file) {
        const contentType = file.type || "application/octet-stream";
        const up = await reqUpload.mutateAsync({ data: { name: file.name, size: file.size, contentType } });
        const put = await fetch(up.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
        if (!put.ok) throw new Error("Upload failed");
        data = { ...data, fileUrl: `/api/storage${up.objectPath}`, fileName: file.name };
      }
      for (const k of ["owner", "version", "effectiveDate", "lastReviewed", "shareUrl", "category"] as const) if (data[k] === "") delete data[k];
      await save.mutateAsync({ data });
      await qc.invalidateQueries({ queryKey: getListResourcesQueryKey() });
      toast({ title: f.id ? "Saved" : "Added", description: f.title });
      onDone();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files?.[0];
    if (!fl) return;
    const ext = "." + fl.name.split(".").pop()?.toLowerCase();
    if (!ACCEPT[f.kind].split(",").includes(ext)) { setErr(`Use ${ACCEPT[f.kind]} for this type.`); return; }
    if (fl.size > MAX) { setErr("File is over 20 MB."); return; }
    setErr(""); setFile(fl);
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-1">
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
        {(["sop", "learning", "toolkit"] as Kind[]).map((k) => (
          <button key={k} type="button" disabled={!!f.id} onClick={() => { setF({ ...blank(k), title: f.title, description: f.description, area: f.area, contentGroup: f.contentGroup }); setFile(null); setErr(""); }}
            className={`rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${f.kind === k ? "bg-card shadow-sm" : "text-muted-foreground"} disabled:opacity-60`} data-testid={`tab-kind-${k}`}>{KIND_LABEL[k]}</button>
        ))}
      </div>
      <Field label="Title"><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} data-testid="input-title" /></Field>
      <Field label="Description"><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => set("description", e.target.value)} data-testid="input-description" /></Field>
      <Field label="Content group" hint="Choose a suggested group or type a new one. Groups organize topics; audience controls access.">
        <input list="content-group-options" maxLength={120} className={inputCls} placeholder="e.g. Inbound" value={f.contentGroup ?? ""} onChange={e => set("contentGroup", e.target.value)} data-testid="input-content-group" />
        <datalist id="content-group-options">{[...new Set([...CONTENT_GROUPS, ...groups])].filter(g => g !== "Ungrouped").map(g => <option key={g} value={g} />)}</datalist>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area">
          <select className={inputCls} value={f.area} onChange={(e) => {
            const area = e.target.value as ResourceInput["area"];
            setF(previous => ({...previous, area, audience: (MANAGER_AREAS as readonly string[]).includes(area) ? "Managers" : previous.audience}));
          }} data-testid="select-area">
            {ALL_AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Audience">
          <select className={inputCls} value={(MANAGER_AREAS as readonly string[]).includes(f.area) ? "Managers" : f.audience} disabled={f.kind === "toolkit" || (MANAGER_AREAS as readonly string[]).includes(f.area)} onChange={(e) => set("audience", e.target.value as ResourceInput["audience"])} data-testid="select-audience">
            <option>Both</option><option>Employees</option><option value="Managers">Supervisors &amp; managers</option>
          </select>
        </Field>
      </div>
      {f.kind === "sop" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner"><input className={inputCls} value={f.owner ?? ""} onChange={(e) => set("owner", e.target.value)} data-testid="input-owner" /></Field>
          <Field label="Version"><input className={inputCls} value={f.version ?? ""} onChange={(e) => set("version", e.target.value)} data-testid="input-version" /></Field>
          <Field label="Effective date"><input type="date" className={inputCls} value={f.effectiveDate ?? ""} onChange={(e) => set("effectiveDate", e.target.value)} data-testid="input-effective" /></Field>
          <Field label="Last reviewed"><input type="date" className={inputCls} value={f.lastReviewed ?? ""} onChange={(e) => set("lastReviewed", e.target.value)} data-testid="input-reviewed" /></Field>
        </div>
      )}
      {f.kind === "learning" && (
        <>
          <Field label="MeetQuinn share link" hint="Paste the actual https:// share URL from MeetQuinn."><input className={inputCls} placeholder="https://" value={f.shareUrl ?? ""} onChange={(e) => set("shareUrl", e.target.value)} data-testid="input-share-url" /></Field>
          <Field label="Estimated minutes"><input type="number" min={1} className={inputCls} value={f.minutes ?? ""} onChange={(e) => set("minutes", e.target.value ? Number(e.target.value) : undefined)} data-testid="input-minutes" /></Field>
        </>
      )}
      {f.kind === "toolkit" && (
        <Field label="Category">
          <select className={inputCls} value={f.category ?? "Meeting Templates"} onChange={(e) => set("category", e.target.value)} data-testid="select-category">
            <option>Meeting Templates</option><option>30-60-90 Assessments</option>
          </select>
        </Field>
      )}
      {hasFile && (
        <Field label={f.fileUrl ? "Replace file" : "Upload file"} hint={`${ACCEPT[f.kind]} · max 20 MB`}>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-card px-3 py-3 text-sm hover:bg-secondary">
            <Upload className="h-4 w-4" />
            <span className="truncate">{file ? file.name : f.fileName ? `Current: ${f.fileName}` : "Choose file"}</span>
            <input type="file" accept={ACCEPT[f.kind]} className="hidden" onChange={pick} data-testid="input-file" />
          </label>
        </Field>
      )}
      {err && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-form-error">{err}</div>}
      <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-60" data-testid="button-save">
        {busy ? (file ? "Uploading..." : "Saving...") : f.id ? "Save changes" : "Add resource"}
      </button>
    </form>
  );
}

export default function AdminPage() {
  const { user } = useSessionUser();
  const search = useSearch();
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const save = useSaveResource();
  const [kind, setKind] = useState<Kind | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [editing, setEditing] = useState<ResourceInput | null>(null);
  const [confirm, setConfirm] = useState<Resource | null>(null);

  const editId = new URLSearchParams(search).get("edit");
  useEffect(() => {
    if (!editId || !list.data) return;
    const r = list.data.find((x) => x.id === editId);
    if (r) setEditing(toInput(r));
  }, [editId, list.data]);

  const rows = useMemo(() => (list.data ?? [])
    .filter((r) => (kind === "all" || r.kind === kind) && (group === "All" || groupName(r) === group) && !!r.archived === showArchived && matches(r, q))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [list.data, kind, group, showArchived, q]);
  const stale = (list.data ?? []).filter((r) => !r.archived && isStale(r)).length;

  if (!isEditor(user)) return <Restricted need="content editor" />;

  function toggleArchive(r: Resource) {
    save.mutate({ data: { ...toInput(r), archived: !r.archived } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResourcesQueryKey() });
        toast({ title: r.archived ? "Restored" : "Archived", description: r.title });
        setConfirm(null);
      },
      onError: () => toast({ title: "Couldn't update", variant: "destructive" }),
    });
  }

  return (
    <div>
      <PageHead kicker="Content editors" title="Admin">Upload documents, add e-learnings, and manage your resource library. Archived items are hidden from everyone, never deleted.</PageHead>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setEditing(blank("sop"))} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground" data-testid="button-add-document">
          <Plus className="h-4 w-4" /> Add document
        </button>
        <button onClick={() => setEditing(blank("learning"))} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground" data-testid="button-add-learning">
          <Plus className="h-4 w-4" /> Add e-learning
        </button>
        <button onClick={() => setEditing(blank("toolkit"))} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold" data-testid="button-add-template">
          <Plus className="h-4 w-4" /> Add manager template
        </button>
        {stale > 0 && <span className="text-sm text-muted-foreground"><b className="text-foreground">{stale}</b> SOPs due for review</span>}
      </div>
      <SearchBox value={q} onChange={setQ} placeholder="Search all resources" />
      <GroupFilter resources={list.data ?? []} value={group} onChange={setGroup} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "sop", "learning", "toolkit"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} data-testid={`filter-kind-${k}`} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{k === "all" ? "All" : KIND_LABEL[k]}</button>
        ))}
        <button onClick={() => setShowArchived((s) => !s)} data-testid="toggle-archived" className={`ml-auto rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${showArchived ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}>
          {showArchived ? "Viewing archived" : "View archived"}
        </button>
      </div>

      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : rows.length ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0" data-testid={`row-admin-${r.id}`}>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{r.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono uppercase">{KIND_LABEL[r.kind]}</span>
                  <AreaTag area={r.area} />
                  {r.contentGroup && <span>{r.contentGroup}</span>}
                  <span className="font-mono">{audienceLabel(r.audience)}</span>
                  {r.kind === "sop" && <span>Reviewed {fmtDate(r.lastReviewed)}</span>}
                  {isStale(r) && <StaleFlag />}
                  {r.kind === "learning" && !r.shareUrl && <span className="text-destructive">Needs MeetQuinn link</span>}
                </div>
              </div>
              <button onClick={() => setEditing(toInput(r))} className="rounded-md border border-border p-2 hover:bg-secondary" aria-label="Edit" data-testid={`button-edit-${r.id}`}><Pencil className="h-4 w-4" /></button>
              <button onClick={() => (r.archived ? toggleArchive(r) : setConfirm(r))} className="rounded-md border border-border p-2 hover:bg-secondary" aria-label={r.archived ? "Restore" : "Archive"} data-testid={`button-archive-${r.id}`}>
                {r.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : <EmptyPanel title={showArchived ? "Nothing archived" : "No resources"}>{showArchived ? "Archived items will wait here until restored." : "Add the first one."}</EmptyPanel>}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="font-display text-2xl uppercase">{editing?.id ? "Edit resource" : editing?.kind === "learning" ? "Add e-learning" : editing?.kind === "toolkit" ? "Add manager template" : "Add document"}</SheetTitle></SheetHeader>
          {editing && <Editor key={editing.id ?? "new"} initial={editing} groups={contentGroups(list.data ?? [])} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{confirm?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>It disappears from the library and search for everyone. You can restore it anytime from View archived.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-archive">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && toggleArchive(confirm)} data-testid="button-confirm-archive">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
