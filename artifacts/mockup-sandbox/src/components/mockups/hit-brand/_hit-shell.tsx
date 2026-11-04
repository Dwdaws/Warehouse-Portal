import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useQueryClient } from "./_preview";
import { BookOpen, Home, PlayCircle, Settings2, Smartphone, Wrench, ArrowLeftRight, MoreHorizontal, X } from "lucide-react";
import { useGetSession, useSignIn, getGetSessionQueryKey, type Session, type User } from "./_preview";
import { SIGNED_OUT_FLAG, isEditor, isManager } from "./_portal";
import { useState } from "react";

const SessionCtx = createContext<{ user: User | null; session?: Session }>({ user: null });
export const useHitSession = () => useContext(SessionCtx);

function AccountChip({ user, dark }: { user: User; dark?: boolean }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <Link href="/login" data-testid="link-switch-account" className={`hit-account ${dark ? "hit-account-dark" : ""}`}>
      <span className="hit-avatar">{initials}</span>
      <span className="hit-account-copy">
        <span className="hit-account-name" data-testid="text-current-user">{user.name}</span>
        <span className="hit-account-meta">{user.role}{user.editor ? " · Editor" : ""} · demo</span>
      </span>
      <ArrowLeftRight aria-hidden="true" />
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return <Link href={href} data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`} className={`hit-nav-link ${active ? "is-active" : ""}`}><Icon aria-hidden="true" /><span>{label}</span></Link>;
}

export function HitShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const qc = useQueryClient();
  const sessionQ = useGetSession({ query: { queryKey: getGetSessionQueryKey(), refetchOnWindowFocus: true, refetchOnMount: true } });
  const signIn = useSignIn();
  const tried = useRef(false);
  const session = sessionQ.data;
  const user = session?.user ?? null;
  const onLogin = location === "/login";

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
  const is = (p: string) => p === "/" ? location === "/" : location.startsWith(p);

  return (
    <SessionCtx.Provider value={{ user, session }}>
      <div className="hit-app">
        <aside className="hit-sidebar">
          <Link href="/" className="hit-brand-lockup" data-testid="link-logo">
            <img src="/__mockup/images/hit-brand/logo-blue.png" alt="Hit Promotional Products" />
            <span className="hit-brand-context">WAREHOUSE<br />PORTAL</span>
          </Link>
          <nav className="hit-nav" aria-label="Main navigation">
            {nav.map((n) => <NavLink key={n.href} {...n} active={is(n.href)} />)}
          </nav>
          <div className="hit-account-wrap"><AccountChip user={user} dark /></div>
        </aside>
        <header className="hit-mobile-header">
          <Link href="/" className="hit-mobile-brand" data-testid="link-logo-mobile">
            <img src="/__mockup/images/hit-brand/logo-blue.png" alt="Hit Promotional Products" />
            <span>WAREHOUSE<br />PORTAL</span>
          </Link>
          <Link href="/login" className="hit-mobile-account" data-testid="link-mobile-account" aria-label={`Switch account for ${user.name}`}>
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </Link>
        </header>
        <main className="hit-main"><div className="hit-main-inner">{children}</div></main>
        <nav className="hit-mobile-nav" aria-label="Mobile navigation">
          <Link href="/" className={is("/") ? "is-active" : ""} data-testid="mobile-nav-home"><Home /><span>Home</span></Link>
          <Link href="/sops" className={is("/sops") ? "is-active" : ""} data-testid="mobile-nav-sops"><BookOpen /><span>SOPs</span></Link>
          <Link href="/learnings" className={is("/learnings") ? "is-active" : ""} data-testid="mobile-nav-learn"><PlayCircle /><span>Learn</span></Link>
          {isManager(user) ? (
            <button type="button" className={toolsOpen ? "is-active" : ""} onClick={() => setToolsOpen((v) => !v)} aria-expanded={toolsOpen} data-testid="button-mobile-tools">{toolsOpen ? <X /> : <MoreHorizontal />}<span>Manager</span></button>
          ) : <Link href="/login" data-testid="mobile-nav-account"><ArrowLeftRight /><span>Account</span></Link>}
        </nav>
        {toolsOpen && isManager(user) && <div className="hit-manager-tools-popover" role="group" aria-label="Manager tools"><Link href="/toolkit" data-testid="mobile-manager-toolkit"><Wrench /><span>Talent Management</span></Link><Link href="/register-device" data-testid="mobile-manager-devices"><Smartphone /><span>Register device</span></Link>{isEditor(user) && <Link href="/admin" data-testid="mobile-manager-admin"><Settings2 /><span>Admin</span></Link>}</div>}
      </div>
    </SessionCtx.Provider>
  );
}
