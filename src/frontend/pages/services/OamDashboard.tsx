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
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useOamSinks,
  useCreateOamSink,
  useDeleteOamSink,
  useOamSinkPolicy,
  usePutOamSinkPolicy,
  useOamAttachedLinks,
  useOamLinks,
  useCreateOamLink,
  useDeleteOamLink,
  type OamSink,
  type OamLink,
} from "../../hooks/useOAM";

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

function PolicyModal({
  sink,
  onClose,
}: {
  sink: OamSink;
  onClose: () => void;
}) {
  const identifier = sink.Arn!;
  const policyQuery = useOamSinkPolicy(identifier);
  const putPolicy = usePutOamSinkPolicy();
  const attached = useOamAttachedLinks(identifier);
  const [policy, setPolicy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const value = policy ?? policyQuery.data?.policy ?? "";

  async function handleSave() {
    setStatus(null);
    try {
      await putPolicy.mutateAsync({ identifier, policy: value });
      setStatus({ type: "success", message: "Sink policy saved." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to save policy" });
    }
  }

  return (
    <Modal visible onDismiss={onClose} header={`Sink policy — ${sink.Name}`}>
      <SpaceBetween size="m">
        {status && (
          <Alert type={status.type} dismissible onDismiss={() => setStatus(null)}>
            {status.message}
          </Alert>
        )}
        <FormField label="Policy JSON">
          <Textarea
            value={value}
            onChange={({ detail }) => setPolicy(detail.value)}
            rows={6}
            placeholder="{ … }"
          />
        </FormField>
        <Box float="right">
          <Button
            variant="primary"
            disabled={!value}
            loading={putPolicy.isPending}
            onClick={handleSave}
          >
            Save policy
          </Button>
        </Box>
        <Container header={<Header variant="h3">Attached links</Header>}>
          <ResourceTable
            resourceName="link"
            headerTitle="Links"
            items={attached.data?.links || []}
            loading={attached.isLoading}
            columns={[
              { id: "label", header: "Label", cell: (l: any) => l.Label },
              { id: "arn", header: "Link ARN", cell: (l: any) => l.LinkArn },
              { id: "types", header: "Resource types", cell: (l: any) => (l.ResourceTypes || []).join(", ") },
            ]}
          />
        </Container>
      </SpaceBetween>
    </Modal>
  );
}

function CreateLinkModal({
  sinks,
  onClose,
}: {
  sinks: OamSink[];
  onClose: () => void;
}) {
  const [sinkIdentifier, setSinkIdentifier] = useState(sinks[0]?.Arn ?? "");
  const [labelTemplate, setLabelTemplate] = useState("$AccountName");
  const [resourceTypes, setResourceTypes] = useState("AWS::Metric");
  const createLink = useCreateOamLink();
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createLink.mutateAsync({
        sinkIdentifier,
        labelTemplate,
        resourceTypes: resourceTypes.split(",").map((t) => t.trim()).filter(Boolean),
      });
      onClose();
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create link" });
    }
  }

  return (
    <Modal visible onDismiss={onClose} header="Create link">
      <Form>
        <SpaceBetween size="m">
          {status && (
            <Alert type={status.type} dismissible onDismiss={() => setStatus(null)}>
              {status.message}
            </Alert>
          )}
          <FormField label="Sink identifier">
            <Input
              value={sinkIdentifier}
              onChange={({ detail }) => setSinkIdentifier(detail.value)}
              placeholder="arn:aws:oam::…"
            />
          </FormField>
          <FormField label="Label template">
            <Input value={labelTemplate} onChange={({ detail }) => setLabelTemplate(detail.value)} />
          </FormField>
          <FormField label="Resource types (comma-separated)">
            <Input value={resourceTypes} onChange={({ detail }) => setResourceTypes(detail.value)} />
          </FormField>
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!sinkIdentifier || !labelTemplate || !resourceTypes}
                loading={createLink.isPending}
                onClick={handleCreate}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

export default function OamDashboard() {
  const sinksQuery = useOamSinks();
  const linksQuery = useOamLinks();
  const createSink = useCreateOamSink();
  const deleteSink = useDeleteOamSink();
  const deleteLink = useDeleteOamLink();
  const [showCreateSink, setShowCreateSink] = useState(false);
  const [newSinkName, setNewSinkName] = useState("");
  const [policyTarget, setPolicyTarget] = useState<OamSink | null>(null);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreateSink() {
    setStatus(null);
    try {
      await createSink.mutateAsync(newSinkName);
      setShowCreateSink(false);
      setNewSinkName("");
      setStatus({ type: "success", message: "Sink created." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create sink" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "sinks",
            label: `Sinks (${sinksQuery.data?.sinks?.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="sink"
                  headerTitle="Sinks"
                  items={sinksQuery.data?.sinks || []}
                  loading={sinksQuery.isLoading}
                  onCreate={() => setShowCreateSink(true)}
                  onRefresh={sinksQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (s: OamSink) => s.Name },
                    { id: "arn", header: "ARN", cell: (s: OamSink) => s.Arn },
                    {
                      id: "actions",
                      header: "",
                      cell: (s: OamSink) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => setPolicyTarget(s)}>Policy</Button>
                          <DeleteButton
                            itemName={s.Name!}
                            resourceType="sink"
                            loading={deleteSink.isPending}
                            onDelete={() => deleteSink.mutateAsync(s.Arn!)}
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
                {sinksQuery.isError && (
                  <Alert type="error">
                    {(sinksQuery.error as Error)?.message || "Failed to load sinks"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "links",
            label: `Links (${linksQuery.data?.links?.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="link"
                headerTitle="Links"
                items={linksQuery.data?.links || []}
                loading={linksQuery.isLoading}
                onCreate={() => setShowCreateLink(true)}
                onRefresh={linksQuery.refetch}
                columns={[
                  { id: "label", header: "Label", cell: (l: OamLink) => l.Label },
                  { id: "arn", header: "ARN", cell: (l: OamLink) => l.Arn },
                  { id: "types", header: "Resource types", cell: (l: OamLink) => (l.ResourceTypes || []).join(", ") },
                  { id: "sink", header: "Sink ARN", cell: (l: OamLink) => l.SinkArn },
                  {
                    id: "actions",
                    header: "",
                    cell: (l: OamLink) => (
                      <DeleteButton
                        itemName={l.Id!}
                        resourceType="link"
                        loading={deleteLink.isPending}
                        onDelete={() => deleteLink.mutateAsync(l.Arn!)}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreateSink}
        onDismiss={() => setShowCreateSink(false)}
        header="Create sink"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Sink name">
              <Input
                value={newSinkName}
                onChange={({ detail }) => setNewSinkName(detail.value)}
                placeholder="monitoring-account"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateSink(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!newSinkName}
                  loading={createSink.isPending}
                  onClick={handleCreateSink}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      {policyTarget && <PolicyModal sink={policyTarget} onClose={() => setPolicyTarget(null)} />}
      {showCreateLink && (
        <CreateLinkModal sinks={sinksQuery.data?.sinks || []} onClose={() => setShowCreateLink(false)} />
      )}
    </SpaceBetween>
  );
}
