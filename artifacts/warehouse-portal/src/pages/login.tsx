import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, KeyRound, LogOut } from "lucide-react";
import { useSignIn, useSignOut, getGetSessionQueryKey, type Session } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { SIGNED_OUT_FLAG } from "@/lib/portal";
import { SafetyNotice } from "@/components/safety-notice";

export default function LoginPage() {
  const { user, session } = useSessionUser();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const [picker, setPicker] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  function done(nextSession: Session) {
    sessionStorage.removeItem(SIGNED_OUT_FLAG);
    // Do not briefly show the previous demo persona's restricted content.
    const sessionKey = getGetSessionQueryKey();
    qc.removeQueries({ predicate: query => query.queryKey[0] !== sessionKey[0] });
    qc.setQueryData(sessionKey, nextSession);
    setLocation("/");
  }
  function asProfile(id: string) {
    setErr("");
    signIn.mutate({ data: { userId: id } }, { onSuccess: done, onError: () => setErr("Couldn't sign in that demo profile.") });
  }
  function redeem(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    signIn.mutate({ data: { code: code.trim() } }, { onSuccess: done, onError: () => setErr("That code is invalid, already used, or expired. Ask your manager for a new one.") });
  }
  function out() {
    signOut.mutate(undefined, { onSuccess: () => { sessionStorage.setItem(SIGNED_OUT_FLAG, "1"); qc.invalidateQueries(); } });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-primary text-primary-foreground">
      <div className="h-2 bg-primary-foreground/20" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
        {user && <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70" data-testid="link-back-home"><ArrowLeft className="h-3.5 w-3.5" /> Back to portal</Link>}
        <SafetyNotice />
        <img src={`${import.meta.env.BASE_URL}images/hit-brand/logo-white.png`} alt="Hit Promotional Products" className="mb-6 h-24 w-auto self-start object-contain" />
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Demo sign-in</div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight">Warehouse Portal</h1>
        <p className="mt-3 text-sm text-primary-foreground/70">SOPs and quick modules for the floor. Sign-in is simulated for this prototype.</p>

        {user && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-primary-foreground/15 px-4 py-3 text-sm">
            <span>Signed in as <b>{user.name}</b> ({user.jobLevel}{user.editor ? ", Editor" : ""})</span>
            <button onClick={out} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-accent" data-testid="button-sign-out"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        )}

        <section className="mt-6 rounded-xl bg-card p-5 text-card-foreground">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Demo profiles · all four job levels</div>
          {!picker ? (
            <button onClick={() => setPicker(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground" data-testid="button-sso">
              <Building2 className="h-4 w-4" /> Choose a demo profile
            </button>
          ) : (
            <div className="mt-2 overflow-hidden rounded-md border border-border">
              {(session?.demoProfiles ?? []).map((m) => (
                <button key={m.id} onClick={() => asProfile(m.id)} disabled={signIn.isPending} className="flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left last:border-0 hover:bg-secondary" data-testid={`option-profile-${m.id}`}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{m.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{m.name}</span><span className="block text-xs text-muted-foreground">{m.jobLevel}{m.editor ? " · Content editor" : ""}</span><span className="font-mono text-[10px] uppercase text-muted-foreground">{m.area}</span></span>
                </button>
              ))}
              {!session?.demoProfiles?.length && <div className="p-4 text-sm text-muted-foreground">No demo profiles seeded.</div>}
            </div>
          )}
        </section>

        <form onSubmit={redeem} className="mt-4 rounded-xl bg-card p-5 text-card-foreground">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Employee device code</div>
          <p className="mt-1 text-xs text-muted-foreground">Your supervisor or manager generates this on Register a Device. One use, 15 minutes.</p>
          <div className="mt-3 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" autoCapitalize="characters" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-3 font-mono text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-ring" data-testid="input-device-code" />
            <button disabled={!code.trim() || signIn.isPending} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-foreground disabled:opacity-50" data-testid="button-redeem"><KeyRound className="h-4 w-4" /> Go</button>
          </div>
        </form>
        {err && <div className="mt-3 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground" data-testid="text-login-error">{err}</div>}
        <p className="mt-auto pt-8 text-center font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50">Prototype · Complements the LMS</p>
      </div>
    </div>
  );
}
