import { useState } from "react";
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  Alert,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useDlmPolicies,
  useCreateDlmPolicy,
  useDeleteDlmPolicy,
  type DlmPolicySummary,
} from "../../hooks/useDLM";

interface Status {
  type: "success" | "error";
  message: string;
}

function StatusAlert({ status, onDismiss }: { status: Status | null; onDismiss: () => void }) {
  if (!status) return null;
  return (
    <Alert type={status.type} dismissible onDismiss={onDismiss}>
      {status.message}
    </Alert>
  );
}

export default function DlmDashboard() {
  const { data, isLoading, isError, error, refetch } = useDlmPolicies();
  const createPolicy = useCreateDlmPolicy();
  const deletePolicy = useDeleteDlmPolicy();
  const [showCreate, setShowCreate] = useState(false);
  const [description, setDescription] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [targetTags, setTargetTags] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createPolicy.mutateAsync({
        executionRoleArn: roleArn,
        description,
        state: "ENABLED",
        policyDetails: [
          {
            ResourceTypes: ["VOLUME"],
            TargetTags: targetTags
              .split(",")
              .map((pair) => pair.trim())
              .filter(Boolean)
              .map((pair) => {
                const [key, value] = pair.split("=");
                return { Key: key, Value: value ?? "" };
              }),
          },
        ],
      });
      setShowCreate(false);
      setDescription("");
      setRoleArn("");
      setTargetTags("");
      setStatus({ type: "success", message: `Policy "${description}" created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create policy" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="lifecycle policy"
        headerTitle="Lifecycle policies"
        emptyMessage="No lifecycle policies found"
        items={data?.policies || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "id", header: "Policy ID", cell: (p: DlmPolicySummary) => p.PolicyId },
          { id: "desc", header: "Description", cell: (p: DlmPolicySummary) => p.Description },
          { id: "state", header: "State", cell: (p: DlmPolicySummary) => p.State },
          {
            id: "actions",
            header: "",
            cell: (p: DlmPolicySummary) => (
              <DeleteButton
                itemName={p.PolicyId!}
                resourceType="lifecycle policy"
                loading={deletePolicy.isPending}
                onDelete={() =>
                  deletePolicy
                    .mutateAsync(p.PolicyId!)
                    .then(() =>
                      setStatus({
                        type: "success",
                        message: `Policy ${p.PolicyId} deleted.`,
                      })
                    )
                }
              />
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load policies"}</Alert>
      )}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create lifecycle policy"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Description">
              <Input
                value={description}
                onChange={({ detail }) => setDescription(detail.value)}
                placeholder="nightly snapshots"
              />
            </FormField>
            <FormField label="Execution role ARN">
              <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::123456789012:role/…" />
            </FormField>
            <FormField label="Target tags (Key=Value, comma-separated)">
              <Textarea
                value={targetTags}
                onChange={({ detail }) => setTargetTags(detail.value)}
                rows={2}
                placeholder="backup=daily"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!description || !roleArn || !targetTags}
                  loading={createPolicy.isPending}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
