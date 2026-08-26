// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Button,
  Tabs,
} from "@cloudscape-design/components";
import {
  useKinesisAnalyticsApplications,
  useKinesisAnalyticsApplication,
  useCreateKinesisAnalyticsApplication,
  useDeleteKinesisAnalyticsApplication,
  useStartKinesisAnalyticsApplication,
  useStopKinesisAnalyticsApplication,
  useKinesisAnalyticsSnapshots,
  useCreateKinesisAnalyticsSnapshot,
  useDeleteKinesisAnalyticsSnapshot,
} from "../../hooks/useKinesisAnalytics";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const RUNTIME_OPTIONS = [
  { value: "FLINK-1_19", label: "FLINK-1_19" },
  { value: "FLINK-1_18", label: "FLINK-1_18" },
  { value: "SQL-1_0", label: "SQL-1_0" },
  { value: "ZEPELLIN-0.10", label: "ZEPELLIN-0.10" },
];

export function KinesisAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("applications");

  // Applications
  const { data: appsData, isLoading: appsLoading } = useKinesisAnalyticsApplications();
  const createApp = useCreateKinesisAnalyticsApplication();
  const deleteApp = useDeleteKinesisAnalyticsApplication();
  const startApp = useStartKinesisAnalyticsApplication();
  const stopApp = useStopKinesisAnalyticsApplication();
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [appForm, setAppForm] = useState({
    name: "",
    runtimeEnvironment: "FLINK-1_19",
    serviceExecutionRole: "",
    description: "",
    codeBucket: "",
    codeKey: "",
  });

  // Detail
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const { data: detailData } = useKinesisAnalyticsApplication(selectedApp);

  // Snapshots
  const { data: snapsData, isLoading: snapsLoading } = useKinesisAnalyticsSnapshots(selectedApp);
  const createSnap = useCreateKinesisAnalyticsSnapshot();
  const deleteSnap = useDeleteKinesisAnalyticsSnapshot();
  const [showCreateSnap, setShowCreateSnap] = useState(false);
  const [snapName, setSnapName] = useState("");

  const handleCreateApp = async () => {
    if (!appForm.name || !appForm.serviceExecutionRole) return;
    try {
      await createApp.mutateAsync({
        name: appForm.name,
        runtimeEnvironment: appForm.runtimeEnvironment,
        serviceExecutionRole: appForm.serviceExecutionRole,
        description: appForm.description || undefined,
        codeBucket: appForm.codeBucket || undefined,
        codeKey: appForm.codeKey || undefined,
      });
      setShowCreateApp(false);
      setAppForm({
        name: "",
        runtimeEnvironment: "FLINK-1_19",
        serviceExecutionRole: "",
        description: "",
        codeBucket: "",
        codeKey: "",
      });
    } catch {}
  };

  const handleCreateSnap = async () => {
    if (!snapName || !selectedApp) return;
    try {
      await createSnap.mutateAsync({ applicationName: selectedApp, snapshotName: snapName });
      setShowCreateSnap(false);
      setSnapName("");
    } catch {}
  };

  const apps = (appsData as any)?.applications || [];

  return (
    <>
      <Tabs
        activeTabId={activeTab}
        onChange={(e) => setActiveTab(e.detail.activeTabId)}
        tabs={[
          {
            label: `Applications (${apps.length})`,
            id: "applications",
            content: (
              <SpaceBetween size="m">
                <Header
                  actions={<Button onClick={() => setShowCreateApp(true)}>Create Application</Button>}
                >
                  Kinesis Analytics Applications
                </Header>
                {appsLoading ? (
                  <Box>Loading...</Box>
                ) : (
                  <ResourceTable
                    resourceName="Application"
                    headerTitle="Applications"
                    headerCounter={apps.length}
                    items={apps.map((a: any) => ({
                      name: a.ApplicationName,
                      status: a.ApplicationStatus || "—",
                      runtime: a.RuntimeEnvironment || "—",
                      version: a.ApplicationVersionId ?? "—",
                      arn: a.ApplicationARN || "",
                    }))}
                    columns={[
                      {
                        id: "name",
                        header: "Name",
                        cell: (item: any) => (
                          <Button
                            variant="link"
                            onClick={() => setSelectedApp(item.name === selectedApp ? null : item.name)}
                          >
                            {item.name}
                          </Button>
                        ),
                      },
                      {
                        id: "status",
                        header: "Status",
                        cell: (item: any) => (
                          <StatusIndicator
                            type={
                              item.status === "RUNNING"
                                ? "success"
                                : item.status === "stopped"
                                ? "stopped"
                                : "in-progress"
                            }
                          >
                            {item.status}
                          </StatusIndicator>
                        ),
                      },
                      { id: "runtime", header: "Runtime", cell: (item: any) => item.runtime },
                      { id: "version", header: "Version", cell: (item: any) => String(item.version) },
                      {
                        id: "actions",
                        header: "Actions",
                        cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              onClick={() => startApp.mutate(item.name)}
                              disabled={startApp.isPending || item.status === "RUNNING"}
                            >
                              Start
                            </Button>
                            <Button
                              onClick={() => stopApp.mutate(item.name)}
                              disabled={stopApp.isPending || item.status !== "RUNNING"}
                            >
                              Stop
                            </Button>
                            <DeleteButton
                              itemName={item.name}
                              resourceType="application"
                              onDelete={async () => {
                                try {
                                  await deleteApp.mutateAsync({
                                    name: item.name,
                                    createTimestamp: 0,
                                  });
                                } catch {}
                              }}
                            />
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    emptyMessage="No applications"
                    filterEnabled
                    filterPlaceholder="Find applications by name"
                    filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: "Snapshots",
            id: "snapshots",
            content: (
              <SpaceBetween size="m">
                <Header
                  actions={
                    <Button onClick={() => setShowCreateSnap(true)} disabled={!selectedApp}>
                      Create Snapshot
                    </Button>
                  }
                >
                  Snapshots {selectedApp ? `(${selectedApp})` : ""}
                </Header>
                {!selectedApp ? (
                  <Box>Select an application from the Applications tab to manage snapshots.</Box>
                ) : snapsLoading ? (
                  <Box>Loading...</Box>
                ) : (
                  <ResourceTable
                    resourceName="Snapshot"
                    headerTitle="Snapshots"
                    headerCounter={(snapsData as any)?.snapshots?.length}
                    items={((snapsData as any)?.snapshots || []).map((s: any) => ({
                      name: s.SnapshotName,
                      status: s.SnapshotStatus || "—",
                      created: s.SnapshotCreationTimestamp
                        ? new Date(s.SnapshotCreationTimestamp).toLocaleString()
                        : "—",
                    }))}
                    columns={[
                      { id: "name", header: "Snapshot", cell: (item: any) => item.name },
                      {
                        id: "status",
                        header: "Status",
                        cell: (item: any) => (
                          <StatusIndicator type={item.status === "READY" ? "success" : "loading"}>
                            {item.status}
                          </StatusIndicator>
                        ),
                      },
                      { id: "created", header: "Created", cell: (item: any) => item.created },
                      {
                        id: "actions",
                        header: "",
                        cell: (item: any) => (
                          <DeleteButton
                            itemName={item.name}
                            resourceType="snapshot"
                            onDelete={async () => {
                              try {
                                await deleteSnap.mutateAsync({
                                  applicationName: selectedApp,
                                  snapshotName: item.name,
                                });
                              } catch {}
                            }}
                          />
                        ),
                      },
                    ]}
                    emptyMessage="No snapshots"
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: "Detail",
            id: "detail",
            content: selectedApp ? (
              <SpaceBetween size="m">
                <Header>Application — {selectedApp}</Header>
                <Box>
                  <Box variant="h4">Status: {(detailData as any)?.application?.status || "—"}</Box>
                  <Box variant="h4">ARN: {(detailData as any)?.application?.arn || "—"}</Box>
                  <Box variant="h4">
                    Runtime: {(detailData as any)?.application?.runtimeEnvironment || "—"} | Version:{" "}
                    {(detailData as any)?.application?.versionId ?? "—"}
                  </Box>
                  <Box variant="h4">
                    Parallelism: {(detailData as any)?.application?.parallelism ?? "—"}
                  </Box>
                  <Box variant="h4">
                    Code:{" "}
                    {(detailData as any)?.application?.codeLocation?.fileKey || "—"}
                  </Box>
                  <Box variant="h4">
                    Role: {(detailData as any)?.application?.serviceExecutionRole || "—"}
                  </Box>
                </Box>
              </SpaceBetween>
            ) : (
              <Box>Select an application to view detail.</Box>
            ),
          },
        ]}
      />

      {/* Create Application Modal */}
      <Modal visible={showCreateApp} onDismiss={() => setShowCreateApp(false)} header="Create Application">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Application Name">
              <Input
                value={appForm.name}
                onChange={(e) => setAppForm({ ...appForm, name: e.detail.value })}
                placeholder="my-flink-app"
              />
            </FormField>
            <FormField label="Runtime Environment">
              <Input
                value={appForm.runtimeEnvironment}
                onChange={(e) => setAppForm({ ...appForm, runtimeEnvironment: e.detail.value })}
              />
            </FormField>
            <FormField label="Service Execution Role ARN">
              <Input
                value={appForm.serviceExecutionRole}
                onChange={(e) => setAppForm({ ...appForm, serviceExecutionRole: e.detail.value })}
                placeholder="arn:aws:iam::123:role/kinesis-analytics"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={appForm.description}
                onChange={(e) => setAppForm({ ...appForm, description: e.detail.value })}
              />
            </FormField>
            <FormField label="Code Bucket ARN (optional)">
              <Input
                value={appForm.codeBucket}
                onChange={(e) => setAppForm({ ...appForm, codeBucket: e.detail.value })}
                placeholder="arn:aws:s3:::my-bucket"
              />
            </FormField>
            <FormField label="Code File Key (optional)">
              <Input
                value={appForm.codeKey}
                onChange={(e) => setAppForm({ ...appForm, codeKey: e.detail.value })}
                placeholder="app.jar"
              />
            </FormField>
            <Button
              onClick={handleCreateApp}
              disabled={!appForm.name || !appForm.serviceExecutionRole || createApp.isPending}
            >
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create Snapshot Modal */}
      <Modal visible={showCreateSnap} onDismiss={() => setShowCreateSnap(false)} header="Create Snapshot">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Snapshot Name">
              <Input
                value={snapName}
                onChange={(e) => setSnapName(e.detail.value)}
                placeholder="my-snapshot"
              />
            </FormField>
            <Button onClick={handleCreateSnap} disabled={!snapName || createSnap.isPending}>
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}
// @v8 ignore end
