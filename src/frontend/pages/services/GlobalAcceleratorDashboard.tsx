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
  Alert,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useGaAccelerators,
  useCreateGaAccelerator,
  useDeleteGaAccelerator,
  useGaListeners,
  useCreateGaListener,
  useDeleteGaListener,
  useGaEndpointGroups,
  useCreateGaEndpointGroup,
  useDeleteGaEndpointGroup,
  type GaAccelerator,
  type GaListener,
  type GaEndpointGroup,
} from "../../hooks/useGlobalAccelerator";

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

function ListenerDetail({
  accelerator,
  onBack,
}: {
  accelerator: GaAccelerator;
  onBack: () => void;
}) {
  const arn = accelerator.AcceleratorArn!;
  const [status, setStatus] = useState<Status | null>(null);
  const listeners = useGaListeners(arn);
  const createListener = useCreateGaListener();
  const deleteListener = useDeleteGaListener();
  const [selectedListener, setSelectedListener] = useState<GaListener | null>(null);
  const endpointGroups = useGaEndpointGroups(selectedListener?.ListenerArn ?? null);
  const createGroup = useCreateGaEndpointGroup();
  const deleteGroup = useDeleteGaEndpointGroup();
  const [showCreateListener, setShowCreateListener] = useState(false);
  const [fromPort, setFromPort] = useState("80");
  const [toPort, setToPort] = useState("80");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupRegion, setGroupRegion] = useState("us-east-1");

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to accelerators
      </Button>
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "listeners",
            label: `Listeners (${listeners.data?.listeners.length ?? 0})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="listener"
                  headerTitle="Listeners"
                  items={listeners.data?.listeners || []}
                  loading={listeners.isLoading}
                  onCreate={() => setShowCreateListener(true)}
                  onRefresh={listeners.refetch}
                  columns={[
                    { id: "arn", header: "ARN", cell: (l: GaListener) => l.ListenerArn },
                    { id: "ports", header: "Ports", cell: (l: GaListener) => (l.PortRanges || []).map((p) => `${p.FromPort}-${p.ToPort}`).join(", ") },
                    { id: "protocol", header: "Protocol", cell: (l: GaListener) => l.Protocol },
                    {
                      id: "actions",
                      header: "",
                      cell: (l: GaListener) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => setSelectedListener(l)}>Endpoint groups</Button>
                          <DeleteButton
                            itemName={l.ListenerArn!}
                            resourceType="listener"
                            loading={deleteListener.isPending}
                            onDelete={() =>
                              deleteListener
                                .mutateAsync(l.ListenerArn!)
                                .then(() => setStatus({ type: "success", message: "Listener deleted." }))
                            }
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
                {selectedListener && (
                  <Container
                    header={
                      <Header
                        variant="h3"
                        actions={<Button onClick={() => setSelectedListener(null)}>Close</Button>}
                      >
                        Endpoint groups
                      </Header>
                    }
                  >
                    <SpaceBetween size="m">
                      <ResourceTable
                        resourceName="endpoint group"
                        headerTitle="Endpoint groups"
                        items={endpointGroups.data?.endpointGroups || []}
                        loading={endpointGroups.isLoading}
                        onCreate={() => setShowCreateGroup(true)}
                        onRefresh={endpointGroups.refetch}
                        columns={[
                          { id: "arn", header: "ARN", cell: (g: GaEndpointGroup) => g.EndpointGroupArn },
                          { id: "region", header: "Region", cell: (g: GaEndpointGroup) => g.EndpointGroupRegion },
                          { id: "dial", header: "Traffic dial", cell: (g: GaEndpointGroup) => `${g.TrafficDialPercentage ?? "—"}%` },
                          {
                            id: "actions",
                            header: "",
                            cell: (g: GaEndpointGroup) => (
                              <DeleteButton
                                itemName={g.EndpointGroupArn!}
                                resourceType="endpoint group"
                                loading={deleteGroup.isPending}
                                onDelete={() =>
                                  deleteGroup
                                    .mutateAsync(g.EndpointGroupArn!)
                                    .then(() => setStatus({ type: "success", message: "Endpoint group deleted." }))
                                }
                              />
                            ),
                          },
                        ]}
                      />
                    </SpaceBetween>
                  </Container>
                )}
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreateListener}
        onDismiss={() => setShowCreateListener(false)}
        header="Create listener"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="From port">
              <Input value={fromPort} onChange={({ detail }) => setFromPort(detail.value)} />
            </FormField>
            <FormField label="To port">
              <Input value={toPort} onChange={({ detail }) => setToPort(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateListener(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createListener.isPending}
                  onClick={() => {
                    createListener
                      .mutateAsync({
                        acceleratorArn: arn,
                        portRanges: [{ FromPort: Number(fromPort), ToPort: Number(toPort) }],
                      })
                      .then(() => {
                        setShowCreateListener(false);
                        setStatus({ type: "success", message: "Listener created." });
                      });
                  }}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showCreateGroup}
        onDismiss={() => setShowCreateGroup(false)}
        header="Create endpoint group"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Region">
              <Input value={groupRegion} onChange={({ detail }) => setGroupRegion(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createGroup.isPending}
                  onClick={() => {
                    createGroup
                      .mutateAsync({ listenerArn: selectedListener!.ListenerArn!, endpointGroupRegion: groupRegion })
                      .then(() => {
                        setShowCreateGroup(false);
                        setStatus({ type: "success", message: "Endpoint group created." });
                      });
                  }}
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

export default function GlobalAcceleratorDashboard() {
  const { data, isLoading, isError, error, refetch } = useGaAccelerators();
  const createAccelerator = useCreateGaAccelerator();
  const deleteAccelerator = useDeleteGaAccelerator();
  const [selected, setSelected] = useState<GaAccelerator | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate() {
    setStatus(null);
    try {
      await createAccelerator.mutateAsync({ name, enabled: true });
      setShowCreate(false);
      setName("");
      setStatus({ type: "success", message: `Accelerator ${name} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create accelerator" });
    }
  }

  if (selected) {
    return <ListenerDetail accelerator={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="accelerator"
        headerTitle="Accelerators"
        items={data?.accelerators || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (a: GaAccelerator) => a.Name },
          { id: "status", header: "Status", cell: (a: GaAccelerator) => a.Status },
          { id: "dns", header: "DNS name", cell: (a: GaAccelerator) => a.DnsName },
          { id: "type", header: "IP type", cell: (a: GaAccelerator) => a.IpAddressType },
          {
            id: "actions",
            header: "",
            cell: (a: GaAccelerator) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelected(a)}>View</Button>
                <DeleteButton
                  itemName={a.Name!}
                  resourceType="accelerator"
                  loading={deleteAccelerator.isPending}
                  onDelete={() =>
                    deleteAccelerator
                      .mutateAsync(a.AcceleratorArn!)
                      .then(() => setStatus({ type: "success", message: `Accelerator ${a.Name} deleted.` }))
                  }
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load accelerators"}</Alert>
      )}
      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create accelerator">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-accelerator" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!name}
                  loading={createAccelerator.isPending}
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
