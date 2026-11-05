import ResourceTable from "../../../components/ResourceTable";
import { useECSTaskDefinitions } from "../../../hooks/useECS";

/** Account-wide task definitions (the console's "Task definitions" page). */
export default function TaskDefinitionsView() {
  const taskDefsQuery = useECSTaskDefinitions();
  return (
    <ResourceTable
      resourceName="Task Definition"
      headerTitle="Task definitions"
      headerCounter={taskDefsQuery.data?.total}
      items={(taskDefsQuery.data?.taskDefinitionArns || []).map((arn: string) => ({ arn }))}
      columns={[
        { id: "arn", header: "Task definition", cell: (item: any) => item.arn.split("/").pop() || item.arn, isRowHeader: true },
      ]}
      loading={taskDefsQuery.isLoading}
      emptyMessage="No task definitions registered."
      filterEnabled
      filterPlaceholder="Find task definitions"
      filterFunction={(item: any, s: string) => (item.arn || "").toLowerCase().includes(s.toLowerCase())}
    />
  );
}
