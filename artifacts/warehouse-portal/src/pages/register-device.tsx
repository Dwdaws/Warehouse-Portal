import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, RotateCcw } from "lucide-react";
import { useListEmployees, getListEmployeesQueryKey, useRegisterDevice, getGetSessionQueryKey, type Registration, type JobLevel } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { ErrorPanel, ListSkeleton, PageHead, Restricted } from "@/components/portal-ui";
import { AREAS, isManager } from "@/lib/portal";
import { useToast } from "@/hooks/use-toast";

const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, new Date(until).getTime() - now);
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return <span className={left === 0 ? "text-destructive" : ""} data-testid="text-countdown">{left === 0 ? "Expired" : `${m}:${String(s).padStart(2, "0")} left`}</span>;
}

export default function RegisterDevicePage() {
  const { user } = useSessionUser();
  const mgr = isManager(user);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selected, setSelected] = useState("");
  const [jobLevel, setJobLevel] = useState<JobLevel>("Frontline Employee");
  const [form, setForm] = useState({ name: "", employeeId: "", area: "Receiving" });
  const [result, setResult] = useState<Registration | null>(null);
  const emps = useListEmployees({ query: { enabled: mgr, queryKey: getListEmployeesQueryKey(), refetchOnMount: true } });
  const reg = useRegisterDevice();

  if (!mgr) return <Restricted need="supervisor or manager" />;

  function generate() {
    const data = mode === "existing" ? { employeeUserId: selected, jobLevel } : { ...form, jobLevel };
    reg.mutate({ data }, {
      onSuccess: (r) => { setResult(r); qc.invalidateQueries({ queryKey: getListEmployeesQueryKey() }); qc.invalidateQueries({ queryKey: getGetSessionQueryKey() }); },
      onError: () => toast({ title: "Couldn't generate code", description: "Check the details and try again.", variant: "destructive" }),
    });
  }
  const ready = mode === "existing" ? !!selected : form.name.trim() && form.employeeId.trim();

  if (result) {
    return (
      <div className="mx-auto max-w-md rise">
        <PageHead kicker="Device registration" title="Hand them this" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hazard h-2" />
          <div className="p-6 text-center">
            <div className="text-sm text-muted-foreground">One-time code for</div>
            <div className="font-display text-2xl font-bold uppercase" data-testid="text-reg-employee">{result.employee.name}</div>
            <div className="font-mono text-xs text-muted-foreground">#{result.employee.employeeId} · {result.employee.jobLevel} · {result.employee.area}</div>
            <div className="my-6 font-mono text-5xl font-semibold tracking-[0.25em]" data-testid="text-reg-code">{result.code}</div>
            <div className="font-mono text-sm"><Countdown until={result.expiresAt} /></div>
            <p className="mt-4 text-sm text-muted-foreground">On their phone: open the portal, choose <b>Employee device code</b>, enter this code. Works once, expires in 15 minutes.</p>
          </div>
          <div className="flex border-t border-border">
            <button onClick={() => { navigator.clipboard?.writeText(result.code); toast({ title: "Code copied" }); }} className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold hover:bg-secondary" data-testid="button-copy-code"><Copy className="h-4 w-4" /> Copy</button>
            <button onClick={() => { setResult(null); setSelected(""); setForm({ name: "", employeeId: "", area: "Receiving" }); }} className="flex flex-1 items-center justify-center gap-2 border-l border-border py-3 text-sm font-semibold hover:bg-secondary" data-testid="button-new-registration"><RotateCcw className="h-4 w-4" /> Register another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHead kicker="Supervisors & managers" title="Register a Device">Get an employee's phone onto the portal in under a minute.</PageHead>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
        {(["existing", "new"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setSelected(""); setJobLevel("Frontline Employee"); }} className={`rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider ${mode === m ? "bg-card shadow-sm" : "text-muted-foreground"}`} data-testid={`tab-${m}`}>{m === "existing" ? "Existing employee" : "Add new"}</button>
        ))}
      </div>
      {mode === "existing" ? (
        emps.isLoading ? <ListSkeleton rows={4} /> : emps.isError ? <ErrorPanel onRetry={() => emps.refetch()} /> : (
          <div className="max-h-[50dvh] overflow-y-auto rounded-lg border border-border bg-card">
            {(emps.data ?? []).length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No employees yet. Add one.</div>}
            {(emps.data ?? []).map((e) => (
              <button key={e.id} onClick={() => { setSelected(e.id); setJobLevel(e.jobLevel); }} data-testid={`option-employee-${e.id}`}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 ${selected === e.id ? "bg-accent/25" : "hover:bg-secondary"}`}>
                <span className={`h-4 w-4 rounded-full border-2 ${selected === e.id ? "border-primary bg-primary" : "border-input"}`} />
                <span className="flex-1 font-semibold">{e.name}</span>
                <span className="font-mono text-xs text-muted-foreground">#{e.employeeId} · {e.jobLevel} · {e.area}</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-emp-name" />
          <input className={inputCls} placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} data-testid="input-emp-id" />
          <select className={inputCls} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} data-testid="select-emp-area">
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      )}
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-semibold">Job level</span>
        <select className={inputCls} value={jobLevel} onChange={event => setJobLevel(event.target.value as JobLevel)} data-testid="select-job-level">
          <option>Frontline Employee</option><option>Lead</option><option>Supervisor</option>
        </select>
        <span className="mt-1 block text-xs text-muted-foreground">Manager accounts use manager sign-in. An existing employee’s job level is saved when you generate their code.</span>
      </label>
      <button disabled={!ready || reg.isPending} onClick={generate} className="mt-4 w-full rounded-md bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50" data-testid="button-generate-code">
        {reg.isPending ? "Generating..." : "Generate one-time code"}
      </button>
    </div>
  );
}
