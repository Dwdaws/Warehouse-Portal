// Preview-only boundaries: original markup/styles are extracted unchanged.
import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";
export type User = { id: string; name: string; employeeId: string; area: string; role: "Employee" | "Manager"; editor: boolean };
export type Session = { user: User | null; managers: User[] };
export type Resource = {
  id: string; kind: "sop" | "learning" | "toolkit"; title: string; description: string;
  area: string; audience: "Both" | "Employees" | "Managers"; createdAt: string; updatedAt: string;
  contentGroup?: string; owner?: string; version?: string; effectiveDate?: string; lastReviewed?: string;
  fileUrl?: string; fileName?: string; shareUrl?: string; minutes?: number; category?: string; archived?: boolean;
};
export const previewUser: User = { id: "m1", name: "Alex Morgan", employeeId: "M001", area: "Shipping", role: "Manager", editor: true };
const session: Session = { user: previewUser, managers: [previewUser] };
export const previewResources: Resource[] = [
  { id: "receiving-check", kind: "sop", title: "Receiving incoming shipments", description: "Check, document, and receive incoming shipments.", area: "Receiving", audience: "Both", contentGroup: "Inbound" },
  { id: "customer-stock", kind: "sop", title: "Customer Supplied Stock", description: "An introductory instructional to the most common pathways in the CSS procedure.", area: "Receiving", audience: "Both", contentGroup: "Inbound" },
  { id: "pick-accuracy", kind: "sop", title: "Pick accuracy checklist", description: "Verify quantities and locations before moving your tote.", area: "Picking", audience: "Both", contentGroup: "Orders and Transfers" },
  { id: "pack-standard", kind: "sop", title: "Packing standards", description: "Carton selection, protection, and packing checks.", area: "Packing", audience: "Both", contentGroup: "Distribution Outbound" },
  { id: "cycle-count", kind: "sop", title: "Cycle count process", description: "Keep inventory accurate with consistent counts.", area: "Inventory", audience: "Both", contentGroup: "Inventory Accuracy" },
  { id: "learning-1", kind: "learning", title: "Your first day on the floor", description: "A quick refresher on floor essentials.", area: "Safety", audience: "Both", minutes: 8 },
  { id: "shipping-labels", kind: "sop", title: "Shipping label checks", description: "Confirm labels before dispatch.", area: "Shipping", audience: "Both", contentGroup: "Distribution Outbound" },
  { id: "one-on-one", kind: "toolkit", title: "One-on-one conversation", description: "A reference for coaching and development.", area: "Talent Management", audience: "Managers" },
].map((r, i) => ({ ...r, version: "1.0", lastReviewed: "2026-11-04", createdAt: `2026-11-0${8 - i}T12:00:00Z`, updatedAt: "2026-11-04T12:00:00Z" })) as Resource[];

let location = "/";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const navigate = (to: string) => { location = to; listeners.forEach(listener => listener()); };
export function useLocation(): [string, (to: string) => void] {
  return [useSyncExternalStore(subscribe, () => location).split("?")[0], navigate];
}
export function useSearch() { return useSyncExternalStore(subscribe, () => location).split("?")[1] || ""; }
export function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href} onClick={event => { event.preventDefault(); onClick?.(event); if (href?.startsWith("/?") || href === "/") navigate(href); }} />;
}
export const getListResourcesQueryKey = () => ["preview-resources"];
export const getGetSessionQueryKey = () => ["preview-session"];
export function useListResources(_options?: unknown) { return { data: previewResources, isLoading: false, isError: false, refetch: async () => {} }; }
export function useGetSession(_options?: unknown) { return { data: session, isError: false, refetch: async () => {} }; }
export function useSignIn() { return { mutate: (_data: unknown, options?: { onSuccess: (s: Session) => unknown; onError: () => unknown }) => options?.onSuccess(session) }; }
export function useQueryClient() { return { setQueryData: (_key: unknown, _value: unknown) => {} }; }
