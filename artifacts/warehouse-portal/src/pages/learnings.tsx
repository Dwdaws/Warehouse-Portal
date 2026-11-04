import { useMemo, useState } from "react";
import { useListResources, getListResourcesQueryKey } from "@workspace/api-client-react";
import { useSessionUser } from "@/components/shell";
import { EmptyPanel, ErrorPanel, ListSkeleton, PageHead } from "@/components/portal-ui";
import { GroupedResources } from "@/components/grouped-resources";
import { AreaFilter, SearchBox } from "@/pages/sops";
import { groupName, matches, visibleResources } from "@/lib/portal";
import { GroupFilter } from "@/components/group-filter";

export default function LearningsPage() {
  const { user } = useSessionUser();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const [group, setGroup] = useState("All");
  const list = useListResources({ query: { queryKey: getListResourcesQueryKey(), refetchOnMount: true } });
  const items = useMemo(() => visibleResources(list.data, user).filter((r) => r.kind === "learning"), [list.data, user]);
  const shown = items.filter((r) => (area === "All" || r.area === area) && (group === "All" || groupName(r) === group) && matches(r, q));

  return (
    <div>
      <PageHead kicker="Short modules via MeetQuinn" title="E-Learnings">Quick refreshers for the floor. Full courses and completions still live in the LMS.</PageHead>
      <SearchBox value={q} onChange={setQ} placeholder="Search modules" />
      <AreaFilter value={area} onChange={setArea} />
      <GroupFilter resources={items} value={group} onChange={setGroup} />
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorPanel onRetry={() => list.refetch()} /> : shown.length ? (
        <GroupedResources resources={shown} />
      ) : <EmptyPanel title="No modules match">Try another area or search term.</EmptyPanel>}
    </div>
  );
}
