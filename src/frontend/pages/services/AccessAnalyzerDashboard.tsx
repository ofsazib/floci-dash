import { useState } from "react";
import {
  Button,
  Header,
  SpaceBetween,
  Box,
  Modal,
  Form,
  FormField,
  Input,
  Alert,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useAaAnalyzers,
  useCreateAaAnalyzer,
  useDeleteAaAnalyzer,
  type AaAnalyzer,
} from "../../hooks/useAccessAnalyzer";

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

export default function AccessAnalyzerDashboard() {
  const { data, isLoading, isError, error, refetch } = useAaAnalyzers();
  const createAnalyzer = useCreateAaAnalyzer();
  const deleteAnalyzer = useDeleteAaAnalyzer();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("ACCOUNT");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createAnalyzer.mutateAsync({ analyzerName: name, type });
      setShowCreate(false);
      setName("");
      setStatus({ type: "success", message: `Analyzer ${name} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create analyzer" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="analyzer"
        headerTitle="Analyzers"
        items={data?.analyzers || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (a: AaAnalyzer) => a.name },
          { id: "type", header: "Type", cell: (a: AaAnalyzer) => a.type },
          { id: "status", header: "Status", cell: (a: AaAnalyzer) => a.status },
          { id: "arn", header: "ARN", cell: (a: AaAnalyzer) => a.arn },
          {
            id: "actions",
            header: "",
            cell: (a: AaAnalyzer) => (
              <DeleteButton
                itemName={a.name!}
                resourceType="analyzer"
                loading={deleteAnalyzer.isPending}
                onDelete={() =>
                  deleteAnalyzer
                    .mutateAsync(a.name!)
                    .then(() =>
                      setStatus({ type: "success", message: `Analyzer ${a.name} deleted.` })
                    )
                }
              />
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load analyzers"}</Alert>
      )}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create analyzer"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Analyzer name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-analyzer" />
            </FormField>
            <FormField label="Type">
              <Input value={type} onChange={({ detail }) => setType(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!name}
                  loading={createAnalyzer.isPending}
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
