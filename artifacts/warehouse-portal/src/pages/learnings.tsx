import { useMemo, useState } from "react";
import { useListResources, getListResourcesQueryKey } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { EmptyPanel, ErrorPanel, ListSkeleton, PageHead, ResourceRow } from "@/components/portal-ui";
import { AreaFilter, SearchBox } from "@/pages/sops";
import { matches, visibleResources } from "@/lib/portal";

export default function LearningsPage() {
  const { user } = useSessionUser();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const items = useMemo(() => visibleResources(list.data, user).filter((r) => r.kind === "learning"), [list.data, user]);
  const shown = items.filter((r) => (area === "All" || r.area === area) && matches(r, q));

  return (
    <div>
      <PageHead kicker="Short modules via MeetQuinn" title="E-Learnings">Quick refreshers for the floor. Full courses and completions still live in the LMS.</PageHead>
      <SearchBox value={q} onChange={setQ} placeholder="Search modules" />
      <AreaFilter value={area} onChange={setArea} />
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : shown.length ? (
        <div className="overflow-hidden rounded-lg border border-border">{shown.map((r, i) => <ResourceRow key={r.id} r={r} index={i} />)}</div>
      ) : <EmptyPanel title="No modules match">Try another area or search term.</EmptyPanel>}
    </div>
  );
}
