import type { Resource, User } from "@workspace/api-client-react";

export const AREAS = ["Receiving", "Picking", "Packing", "Shipping", "Inventory", "Safety"] as const;
export type Area = (typeof AREAS)[number];
export const MANAGER_AREAS = ["Talent Management"] as const;
export const ALL_AREAS = [...AREAS, ...MANAGER_AREAS] as const;
export const CONTENT_GROUPS = [
  "Inbound", "Putaway and Storage", "Orders and Transfers", "Distribution Outbound",
  "Inventory Accuracy", "System How-Tos and References",
] as const;
export const groupName = (r: Resource) => r.contentGroup || "Ungrouped";
export const contentGroups = (resources: Resource[]) =>
  [...new Set([...CONTENT_GROUPS, ...resources.map(groupName)])].sort((a, b) => a.localeCompare(b));

/* Floor-tape colors: each area gets the color it would be marked with on the warehouse floor. */
export const AREA_STYLE: Record<string, { hue: string; code: string; note: string }> = {
  Receiving: { hue: "205 70% 42%", code: "RCV", note: "Dock-in, check-in, put-away" },
  Picking: { hue: "150 52% 32%", code: "PCK", note: "Pick paths, scanners, totes" },
  Packing: { hue: "24 85% 50%", code: "PAK", note: "Kitting, cartons, dunnage" },
  Shipping: { hue: "265 35% 45%", code: "SHP", note: "Manifests, carriers, LTL" },
  Inventory: { hue: "188 60% 32%", code: "INV", note: "Cycle counts, adjustments" },
  Safety: { hue: "4 72% 48%", code: "SAF", note: "PPE, forklifts, incidents" },
  "Talent Management": { hue: "325 48% 40%", code: "TLM", note: "Coaching, development, and performance" },
};

export const areaColor = (area: string, alpha = 1) =>
  `hsl(${AREA_STYLE[area]?.hue ?? "216 20% 40%"} / ${alpha})`;

/** Shared management-tool access; content editing still requires isEditor. */
export const isManager = (u?: User | null) => u?.role === "Manager" || u?.jobLevel === "Supervisor";
export const audienceLabel = (audience: Resource["audience"]) => audience === "Managers" ? "Supervisors & managers" : audience;
export const isEditor = (u?: User | null) => !!u && u.role === "Manager" && u.editor;
export const areasForUser = (u?: User | null) => isManager(u) ? ALL_AREAS : AREAS;

/** Frontend mirror of role visibility. Archived items only show in admin. */
export function canSee(r: Resource, user?: User | null, includeArchived = false) {
  if (!user) return false;
  if (r.archived && !includeArchived) return false;
  if ((MANAGER_AREAS as readonly string[]).includes(r.area) && !isManager(user)) return false;
  if (r.kind === "toolkit") return isManager(user);
  if (r.audience === "Managers") return isManager(user);
  return true;
}

export function visibleResources(list: Resource[] | undefined, user?: User | null) {
  return (list ?? []).filter((r) => canSee(r, user));
}

export function isStale(r: Resource) {
  if (r.kind !== "sop") return false;
  if (!r.lastReviewed) return true;
  const d = new Date(r.lastReviewed);
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  return d <= yearAgo;
}

export function fmtDate(v?: string) {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? v + "T12:00:00" : v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const isPdf = (r: Resource) =>
  !!r.fileUrl && ((r.fileName ?? r.fileUrl).toLowerCase().endsWith(".pdf"));

export const KIND_LABEL: Record<string, string> = { sop: "SOP", learning: "E-Learning", toolkit: "Toolkit" };

export const resourceHref = (r: Resource) =>
  r.kind === "sop" ? `/sops/${r.id}` : r.kind === "learning" ? `/learnings/${r.id}` : `/toolkit`;

export function matches(r: Resource, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [r.title, r.description, r.area, r.contentGroup, r.owner, r.category, r.fileName]
    .filter(Boolean)
    .some((f) => String(f).toLowerCase().includes(s));
}

export const SIGNED_OUT_FLAG = "wp-signed-out";
