import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Home, PlayCircle, Settings2, Smartphone, Wrench, ArrowLeftRight } from "lucide-react";
import { useGetSession, useSignIn, getGetSessionQueryKey, type Session, type User } from "@workspace/api-client-react";
import { SIGNED_OUT_FLAG, isEditor, isManager } from "@/lib/portal";

const SessionCtx = createContext<{ user: User | null; session?: Session }>({ user: null });
export const useSessionUser = () => useContext(SessionCtx);

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      href={href}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors md:flex-none md:flex-row md:gap-3 md:rounded-md md:px-3 md:py-2.5 md:text-sm md:normal-case md:tracking-normal ${
        active ? "text-accent md:bg-sidebar-accent" : "text-sidebar-foreground/65 hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="h-5 w-5 md:h-4 md:w-4" />
      <span>{label}</span>
      {active && <span className="absolute inset-x-4 top-0 h-0.5 bg-accent md:inset-y-2 md:left-0 md:right-auto md:h-auto md:w-0.5" />}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const sessionQ = useGetSession({ query: { queryKey: getGetSessionQueryKey(), refetchOnWindowFocus: true, refetchOnMount: true } });
  const signIn = useSignIn();
  const tried = useRef(false);
  const session = sessionQ.data;
  const user = session?.user ?? null;
  const onLogin = location === "/login";

  // Demo convenience: with no session and no explicit sign-out, auto-enter as seeded editor manager m1.
  useEffect(() => {
    if (!session || user || onLogin || tried.current) return;
    if (sessionStorage.getItem(SIGNED_OUT_FLAG)) {
      setLocation("/login");
      return;
    }
    tried.current = true;
    signIn.mutate(
      { data: { userId: "m1" } },
      {
        onSuccess: (s) => qc.setQueryData(getGetSessionQueryKey(), s),
        onError: () => setLocation("/login"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, onLogin]);

  if (onLogin) return <SessionCtx.Provider value={{ user, session }}>{children}</SessionCtx.Provider>;

  if (sessionQ.isError) {
    return (
      <div className="grid min-h-[100dvh] place-items-center p-6 text-center">
        <div>
          <div className="font-display text-3xl font-bold uppercase">Portal offline</div>
          <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => sessionQ.refetch()} data-testid="button-retry-session">Retry</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <div className="w-56">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Clocking in</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="hazard h-full w-full animate-pulse" /></div>
        </div>
      </div>
    );
  }

  const is = (p: string) => (p === "/" ? location === "/" : location.startsWith(p) || (p === "/toolkit" && location.startsWith("/viewing-report")));
  const nav = [
    { href: "/", label: "Home", icon: Home, show: true },
    { href: "/sops", label: "SOPs", icon: BookOpen, show: true },
    { href: "/learnings", label: "Learn", icon: PlayCircle, show: true },
    { href: "/toolkit", label: "Toolkit", icon: Wrench, show: isManager(user) },
    { href: "/register-device", label: "Devices", icon: Smartphone, show: isManager(user) },
    { href: "/admin", label: "Admin", icon: Settings2, show: isEditor(user) },
  ].filter((n) => n.show);

  return (
    <SessionCtx.Provider value={{ user, session }}>
      <div className="min-h-[100dvh] md:pl-60">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
          <Link href="/" className="flex items-center gap-2.5 px-5 py-5" data-testid="link-logo">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-accent font-display text-lg font-extrabold text-accent-foreground">WP</div>
            <div className="leading-none">
              <div className="font-display text-xl font-bold uppercase">Warehouse</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/60">Portal</div>
            </div>
          </Link>
          <nav className="flex flex-col gap-0.5 px-3">
            {nav.map((n) => <NavItem key={n.href} {...n} active={is(n.href)} />)}
          </nav>
          <div className="mt-auto p-3"><AccountChip user={user} dark /></div>
        </aside>

        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2" data-testid="link-logo-mobile">
            <div className="grid h-8 w-8 place-items-center rounded bg-primary font-display font-extrabold text-accent">WP</div>
            <span className="font-display text-lg font-bold uppercase">Warehouse Portal</span>
          </Link>
          <AccountChip user={user} />
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
          {nav.map((n) => <NavItem key={n.href} {...n} active={is(n.href)} />)}
        </nav>
      </div>
    </SessionCtx.Provider>
  );
}

function AccountChip({ user, dark }: { user: User; dark?: boolean }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <Link
      href="/login"
      data-testid="link-switch-account"
      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${dark ? "border-sidebar-border hover:bg-sidebar-accent" : "border-border bg-card hover:bg-secondary"}`}
    >
      <div className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">{initials}</div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-xs font-semibold" data-testid="text-current-user">{user.name}</div>
        <div className={`font-mono text-[9px] uppercase tracking-wider ${dark ? "text-sidebar-foreground/60" : "text-muted-foreground"}`}>
          {user.role}{user.editor ? " · Editor" : ""} · demo
        </div>
      </div>
      <ArrowLeftRight className="ml-auto h-3.5 w-3.5 opacity-60" />
    </Link>
  );
}


