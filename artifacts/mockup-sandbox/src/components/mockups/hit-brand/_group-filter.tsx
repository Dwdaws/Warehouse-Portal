import type { Resource } from "./_preview";
import { contentGroups } from "./_portal";

export function GroupFilter({ resources, value, onChange }: {
  resources: Resource[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">Content group</span>
      <select
        aria-label="Filter by content group"
        data-testid="filter-content-group"
        className="min-w-0 max-w-full rounded-md border border-input bg-card px-3 py-2.5"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="All">All content groups</option>
        {contentGroups(resources).map(group => <option key={group} value={group}>{group}</option>)}
      </select>
    </label>
  );
}
