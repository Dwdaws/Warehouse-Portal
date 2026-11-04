import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Home, PlayCircle, Settings2, Smartphone, Wrench, ArrowLeftRight, MoreHorizontal, X } from "lucide-react";
import { useGetSession, useSignIn, getGetSessionQueryKey, type Session, type User } from "@workspace/api-client-react";
import { SIGNED_OUT_FLAG, isEditor, isManager } from "@/lib/portal";
import { useState } from "react";
import { SafetyNotice } from "./safety-notice";

const SessionCtx = createContext<{ user: User | null; session?: Session }>({ user: null });
export const useSessionUser = () => useContext(SessionCtx);

function AccountChip({ user, dark }: { user: User; dark?: boolean }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <Link href="/login" data-testid="link-switch-account" className={`hit-account ${dark ? "hit-account-dark" : ""}`}>
      <span className="hit-avatar">{initials}</span>
      <span className="hit-account-copy">
        <span className="hit-account-name" data-testid="text-current-user">{user.name}</span>
        <span className="hit-account-meta">{user.jobLevel || (user.role === "Manager" ? "Manager" : "Frontline Employee")}{user.editor ? " · Editor" : ""} · demo</span>
      </span>
      <ArrowLeftRight aria-hidden="true" />
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return <Link href={href} data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`} className={`hit-nav-link ${active ? "is-active" : ""}`}><Icon aria-hidden="true" /><span>{label}</span></Link>;
}

export function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();
  const sessionQ = useGetSession({ query: { queryKey: getGetSessionQueryKey(), refetchOnWindowFocus: true, refetchOnMount: true } });
  const signIn = useSignIn();
  const tried = useRef(false);
  const session = sessionQ.data;
  const user = session?.user ?? null;
  const onLogin = location === "/login";

  useEffect(() => { setToolsOpen(false); }, [location, user?.id]);
  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setToolsOpen(false);
        toolsButtonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node) && !toolsButtonRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [toolsOpen]);

  useEffect(() => {
    if (!session || user || onLogin || tried.current) return;
    if (sessionStorage.getItem(SIGNED_OUT_FLAG)) { setLocation("/login"); return; }
    tried.current = true;
    signIn.mutate({ data: { userId: "m1" } }, {
      onSuccess: (s) => qc.setQueryData(getGetSessionQueryKey(), s),
      onError: () => setLocation("/login"),
    });
  }, [session, user, onLogin]);

  if (onLogin) return <SessionCtx.Provider value={{ user, session }}>{children}</SessionCtx.Provider>;
  if (sessionQ.isError) return <div className="hit-app"><main className="hit-main"><section className="hit-panel"><div className="hit-panel-title">Warehouse Portal is unavailable</div><p>Check your connection and try again.</p><button className="hit-manager-action" onClick={() => sessionQ.refetch()} data-testid="button-retry-session">Retry</button></section></main></div>;
  if (!user) return <div className="hit-app"><main className="hit-main"><div className="hit-skeleton-row"><div className="hit-skeleton-box" /><div className="hit-skeleton-lines"><i /><i /></div></div></main></div>;

  const nav = [
    { href: "/", label: "Home", icon: Home },
    { href: "/sops", label: "SOPs", icon: BookOpen },
    { href: "/learnings", label: "Learn", icon: PlayCircle },
    ...(isManager(user) ? [{ href: "/toolkit", label: "Toolkit", icon: Wrench }, { href: "/register-device", label: "Devices", icon: Smartphone }] : []),
    ...(isEditor(user) ? [{ href: "/admin", label: "Admin", icon: Settings2 }] : []),
  ];
  const is = (p: string) => p === "/" ? location === "/" : location.startsWith(p) || (p === "/toolkit" && location.startsWith("/viewing-report"));
  const managerPage = is("/toolkit") || is("/register-device") || is("/admin");

  return (
    <SessionCtx.Provider value={{ user, session }}>
      <div className="hit-app">
        <aside className="hit-sidebar">
          <Link href="/" className="hit-brand-lockup" data-testid="link-logo">
            <img src={`${import.meta.env.BASE_URL}images/hit-brand/logo-blue.png`} alt="Hit Promotional Products" />
            <span className="hit-brand-context">WAREHOUSE<br />PORTAL</span>
          </Link>
          <nav className="hit-nav" aria-label="Main navigation">
            {nav.map((n) => <NavLink key={n.href} {...n} active={is(n.href)} />)}
          </nav>
          <div className="hit-account-wrap"><AccountChip user={user} dark /></div>
        </aside>
        <header className="hit-mobile-header">
          <Link href="/" className="hit-mobile-brand" data-testid="link-logo-mobile">
            <img src={`${import.meta.env.BASE_URL}images/hit-brand/logo-blue.png`} alt="Hit Promotional Products" />
            <span>WAREHOUSE<br />PORTAL</span>
          </Link>
          <Link href="/login" className="hit-mobile-account" data-testid="link-mobile-account" aria-label={`Switch account for ${user.name}`}>
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </Link>
        </header>
        <main className="hit-main"><div className="hit-main-inner"><SafetyNotice />{children}</div></main>
        <nav className="hit-mobile-nav" aria-label="Mobile navigation">
          <Link href="/" className={is("/") ? "is-active" : ""} data-testid="mobile-nav-home"><Home /><span>Home</span></Link>
          <Link href="/sops" className={is("/sops") ? "is-active" : ""} data-testid="mobile-nav-sops"><BookOpen /><span>SOPs</span></Link>
          <Link href="/learnings" className={is("/learnings") ? "is-active" : ""} data-testid="mobile-nav-learn"><PlayCircle /><span>Learn</span></Link>
          {isManager(user) ? (
            <button ref={toolsButtonRef} type="button" className={toolsOpen || managerPage ? "is-active" : ""} onClick={() => setToolsOpen((v) => !v)} aria-expanded={toolsOpen} aria-controls="manager-tools" data-testid="button-mobile-tools">{toolsOpen ? <X /> : <MoreHorizontal />}<span>Tools</span></button>
          ) : <Link href="/login" data-testid="mobile-nav-account"><ArrowLeftRight /><span>Account</span></Link>}
        </nav>
        {toolsOpen && isManager(user) && <div ref={toolsRef} id="manager-tools" className="hit-manager-tools-popover" role="group" aria-label="Manager tools"><Link href="/toolkit" data-testid="mobile-manager-toolkit"><Wrench /><span>Manager Toolkit</span></Link><Link href="/register-device" data-testid="mobile-manager-devices"><Smartphone /><span>Register device</span></Link>{isEditor(user) && <Link href="/admin" data-testid="mobile-manager-admin"><Settings2 /><span>Admin</span></Link>}</div>}
      </div>
    </SessionCtx.Provider>
  );
}
