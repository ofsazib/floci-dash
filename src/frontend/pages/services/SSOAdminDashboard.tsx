import {
  Box,
  Header,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useSSOInstances } from "../../hooks/useSSOAdmin";
import ResourceTable from "../../components/ResourceTable";

export function SSOAdminDashboard() {
  const { data, isLoading } = useSSOInstances();

  const instances: any[] = data?.instances || [];

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">IAM Identity Center (SSO Admin)</Header>
        <Box color="text-body-secondary">
          Identity Center instances exposed by the Floci emulator. Floci models the single
          organization instance; permission sets and assignments are not emulated.
        </Box>
      </Box>

      <ResourceTable
        resourceName="Instance"
        headerTitle="Identity Center instances"
        headerCounter={data?.total}
        items={instances.map((i) => ({
          id: i.InstanceArn,
          arn: i.InstanceArn,
          identityStoreId: i.IdentityStoreId,
          name: i.Name,
          ownerAccountId: i.OwnerAccountId,
          status: i.Status,
        }))}
        loading={isLoading}
        emptyMessage="No Identity Center instances"
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name || "—", isRowHeader: true },
          {
            id: "arn",
            header: "Instance ARN",
            cell: (i: any) => <Box variant="code">{i.arn}</Box>,
          },
          {
            id: "identityStoreId",
            header: "Identity store ID",
            cell: (i: any) => <Box variant="code">{i.identityStoreId || "—"}</Box>,
          },
          { id: "ownerAccountId", header: "Owner account", cell: (i: any) => i.ownerAccountId || "—" },
          { id: "status", header: "Status", cell: (i: any) => i.status || "—" },
        ]}
        filterEnabled
        filterPlaceholder="Find instances by name or ARN"
        filterFunction={(i: any, s: string) =>
          `${i.name ?? ""} ${i.arn}`.toLowerCase().includes(s.toLowerCase())
        }
      />
    </SpaceBetween>
  );
}
