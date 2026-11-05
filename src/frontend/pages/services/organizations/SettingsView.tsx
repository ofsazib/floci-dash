import { useState } from "react";
import { Box, Button, ColumnLayout, Container, Header, SpaceBetween } from "@cloudscape-design/components";
import { useDeleteOrg, type OrgOrganization } from "../../../hooks/useOrganizations";
import { useToast } from "../../../components/Toast";
import TypedConfirmModal from "../../../components/TypedConfirmModal";

const FEATURE_SETS: Record<string, string> = { ALL: "All features", CONSOLIDATED_BILLING: "Consolidated billing" };

/** "Settings" page: organization details and Delete organization (type the ID to confirm). */
export default function SettingsView({ org }: { org: OrgOrganization }) {
  const { showToast } = useToast();
  const deleteOrg = useDeleteOrg();
  const [confirming, setConfirming] = useState(false);

  const details: [string, string | undefined][] = [
    ["Organization ID", org.Id],
    ["Organization ARN", org.Arn],
    ["Feature set", org.FeatureSet && (FEATURE_SETS[org.FeatureSet] ?? org.FeatureSet)],
    ["Management account ID", org.MasterAccountId],
    ["Management account email", org.MasterAccountEmail],
  ];

  async function handleDelete() {
    try {
      await deleteOrg.mutateAsync();
      showToast("success", "Organization deleted.");
    } catch (e) {
      showToast("error", (e as Error)?.message || "Failed to delete organization");
    }
    setConfirming(false);
  }

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Settings</Header>
      <Container header={<Header variant="h2">Organization details</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          {details.map(([label, value]) => (
            <div key={label}>
              <Box variant="awsui-key-label">{label}</Box>
              <div>{value || "-"}</div>
            </div>
          ))}
        </ColumnLayout>
      </Container>
      <Container
        header={
          <Header variant="h2" actions={<Button onClick={() => setConfirming(true)}>Delete organization</Button>}>
            Delete organization
          </Header>
        }
      >
        <Box variant="p">
          Deleting the organization removes it and all its policies. The management account becomes a standalone account. You can
          delete the organization only after all member accounts have been removed.
        </Box>
      </Container>
      <TypedConfirmModal
        visible={confirming}
        header="Delete organization"
        confirmValue={org.Id}
        confirmLabel="Delete organization"
        loading={deleteOrg.isPending}
        onConfirm={handleDelete}
        onDismiss={() => setConfirming(false)}
      >
        Deleted organizations cannot be recovered.
      </TypedConfirmModal>
    </SpaceBetween>
  );
}
