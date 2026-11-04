import type { Resource } from "@workspace/api-client-react";
import { ResourceRow } from "@/components/portal-ui";
import { groupName } from "@/lib/portal";

export function GroupedResources({ resources, showStale = false }: {
  resources: Resource[];
  showStale?: boolean;
}) {
  const groups = new Map<string, Resource[]>();
  for (const resource of resources) {
    const group = groupName(resource);
    groups.set(group, [...(groups.get(group) ?? []), resource]);
  }
  return (
    <div className="space-y-5">
      {[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([group, items]) => (
        <section key={group} aria-label={group}>
          <h2 className="mb-2 font-display text-xl font-bold uppercase">
            {group} <span className="ml-1 font-mono text-xs text-muted-foreground">({items.length})</span>
          </h2>
          <div className="overflow-hidden rounded-lg border border-border">
            {items.map((r, i) => <ResourceRow key={r.id} r={r} index={i} showStale={showStale} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
