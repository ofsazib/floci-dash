import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
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
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useAiEventIntegrations,
  useCreateAiEventIntegration,
  useDeleteAiEventIntegration,
  useAiDataIntegrations,
  useCreateAiDataIntegration,
  useDeleteAiDataIntegration,
  type AiEventIntegration,
  type AiDataIntegration,
} from "../../hooks/useAppIntegrations";

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

export default function AppIntegrationsDashboard() {
  const eventsQuery = useAiEventIntegrations();
  const dataQuery = useAiDataIntegrations();
  const createEvent = useCreateAiEventIntegration();
  const deleteEvent = useDeleteAiEventIntegration();
  const createData = useCreateAiDataIntegration();
  const deleteData = useDeleteAiDataIntegration();

  const [status, setStatus] = useState<Status | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventBus, setEventBus] = useState("");
  const [eventSource, setEventSource] = useState("aws.connect");
  const [showCreateData, setShowCreateData] = useState(false);
  const [dataName, setDataName] = useState("");
  const [dataUri, setDataUri] = useState("");
  const [dataKms, setDataKms] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "events",
            label: `Event integrations (${eventsQuery.data?.eventIntegrations.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="event integration"
                  headerTitle="Event integrations"
                  items={eventsQuery.data?.eventIntegrations || []}
                  loading={eventsQuery.isLoading}
                  onCreate={() => setShowCreateEvent(true)}
                  onRefresh={eventsQuery.refetch}
                  columns={[
                    { id: "name", header: "Name", cell: (e: AiEventIntegration) => e.Name },
                    { id: "arn", header: "ARN", cell: (e: AiEventIntegration) => e.EventIntegrationArn },
                    {
                      id: "actions",
                      header: "",
                      cell: (e: AiEventIntegration) => (
                        <DeleteButton
                          itemName={e.Name!}
                          resourceType="event integration"
                          loading={deleteEvent.isPending}
                          onDelete={() =>
                            wrap(
                              () => deleteEvent.mutateAsync(e.Name!),
                              `Event integration ${e.Name} deleted.`
                            )
                          }
                        />
                      ),
                    },
                  ]}
                />
                {eventsQuery.isError && (
                  <Alert type="error">
                    {(eventsQuery.error as Error)?.message || "Failed to load event integrations"}
                  </Alert>
                )}
              </SpaceBetween>
            ),
          },
          {
            id: "data",
            label: `Data integrations (${dataQuery.data?.dataIntegrations.length ?? 0})`,
            content: (
              <ResourceTable
                resourceName="data integration"
                headerTitle="Data integrations"
                items={dataQuery.data?.dataIntegrations || []}
                loading={dataQuery.isLoading}
                onCreate={() => setShowCreateData(true)}
                onRefresh={dataQuery.refetch}
                columns={[
                  { id: "name", header: "Name", cell: (d: AiDataIntegration) => d.Name },
                  { id: "arn", header: "ARN", cell: (d: AiDataIntegration) => d.Arn },
                  { id: "uri", header: "Source URI", cell: (d: AiDataIntegration) => d.SourceURI },
                  {
                    id: "actions",
                    header: "",
                    cell: (d: AiDataIntegration) => (
                      <DeleteButton
                        itemName={d.Name!}
                        resourceType="data integration"
                        loading={deleteData.isPending}
                        onDelete={() =>
                          wrap(
                            () => deleteData.mutateAsync(d.Name!),
                            `Data integration ${d.Name} deleted.`
                          )
                        }
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
        visible={showCreateEvent}
        onDismiss={() => setShowCreateEvent(false)}
        header="Create event integration"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={eventName} onChange={({ detail }) => setEventName(detail.value)} placeholder="ev1" />
            </FormField>
            <FormField label="EventBridge bus ARN">
              <Input value={eventBus} onChange={({ detail }) => setEventBus(detail.value)} placeholder="arn:aws:events::…" />
            </FormField>
            <FormField label="Event filter source">
              <Input value={eventSource} onChange={({ detail }) => setEventSource(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!eventName || !eventBus || !eventSource}
                  loading={createEvent.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createEvent.mutateAsync({
                          name: eventName,
                          eventBridgeBus: eventBus,
                          eventFilter: { Source: eventSource },
                        }),
                      `Event integration ${eventName} created.`
                    ).then(() => setShowCreateEvent(false))
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateData}
        onDismiss={() => setShowCreateData(false)}
        header="Create data integration"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={dataName} onChange={({ detail }) => setDataName(detail.value)} placeholder="di1" />
            </FormField>
            <FormField label="Source URI">
              <Input value={dataUri} onChange={({ detail }) => setDataUri(detail.value)} placeholder="s3://bucket/prefix" />
            </FormField>
            <FormField label="KMS key ARN">
              <Input value={dataKms} onChange={({ detail }) => setDataKms(detail.value)} placeholder="arn:aws:kms::…" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateData(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!dataName || !dataUri || !dataKms}
                  loading={createData.isPending}
                  onClick={() =>
                    wrap(
                      () =>
                        createData.mutateAsync({
                          name: dataName,
                          sourceUri: dataUri,
                          kmsKey: dataKms,
                        }),
                      `Data integration ${dataName} created.`
                    ).then(() => setShowCreateData(false))
                  }
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
