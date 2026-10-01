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
  useBedrockGuardrails,
  useCreateBedrockGuardrail,
  useDeleteBedrockGuardrail,
  type BedrockGuardrailSummary,
} from "../../hooks/useBedrockGuardrails";

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

export default function BedrockGuardrailsDashboard() {
  const { data, isLoading, isError, error, refetch } = useBedrockGuardrails();
  const createGuardrail = useCreateBedrockGuardrail();
  const deleteGuardrail = useDeleteBedrockGuardrail();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [blockedInput, setBlockedInput] = useState("Sorry, I can't answer that.");
  const [blockedOutput, setBlockedOutput] = useState("Sorry, I can't provide that response.");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createGuardrail.mutateAsync({
        name,
        description: description || undefined,
        blockedInputMessaging: blockedInput,
        blockedOutputsMessaging: blockedOutput,
      });
      setShowCreate(false);
      setName("");
      setDescription("");
      setStatus({ type: "success", message: `Guardrail ${name} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create guardrail" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="guardrail"
        headerTitle="Guardrails"
        items={data?.guardrails || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (g: BedrockGuardrailSummary) => g.name },
          { id: "status", header: "Status", cell: (g: BedrockGuardrailSummary) => g.status },
          { id: "version", header: "Version", cell: (g: BedrockGuardrailSummary) => g.version },
          { id: "desc", header: "Description", cell: (g: BedrockGuardrailSummary) => g.description ?? "—" },
          { id: "id", header: "ID", cell: (g: BedrockGuardrailSummary) => g.id },
          {
            id: "actions",
            header: "",
            cell: (g: BedrockGuardrailSummary) => (
              <DeleteButton
                itemName={g.name!}
                resourceType="guardrail"
                loading={deleteGuardrail.isPending}
                onDelete={() =>
                  deleteGuardrail
                    .mutateAsync({ id: g.id! })
                    .then(() =>
                      setStatus({
                        type: "success",
                        message: `Guardrail ${g.name} deleted.`,
                      })
                    )
                }
              />
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load guardrails"}</Alert>
      )}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create guardrail"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="safe-guardrail" />
            </FormField>
            <FormField label="Description (optional)">
              <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
            </FormField>
            <FormField label="Blocked input messaging">
              <Textarea
                value={blockedInput}
                onChange={({ detail }) => setBlockedInput(detail.value)}
                rows={2}
              />
            </FormField>
            <FormField label="Blocked output messaging">
              <Textarea
                value={blockedOutput}
                onChange={({ detail }) => setBlockedOutput(detail.value)}
                rows={2}
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!name}
                  loading={createGuardrail.isPending}
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
