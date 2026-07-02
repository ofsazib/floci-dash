import { useState } from "react";
import {
  SpaceBetween,
  Box,
  Button,
  Header,
  Tabs,
  Container,
  Form,
  FormField,
  Input,
  Modal,
  Alert,
  StatusIndicator,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import {
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useApplicationVersions,
  useCreateApplicationVersion,
  useDeleteApplicationVersion,
  useEnvironments,
  useCreateEnvironment,
  useDeleteEnvironment,
  useConfigurationSettings,
} from "../../hooks/useElasticBeanstalk";

export function ElasticBeanstalkDashboard() {
  const appsQuery = useApplications();
  const createApp = useCreateApplication();
  const deleteApp = useDeleteApplication();
  const createVersion = useCreateApplicationVersion();
  const deleteVersion = useDeleteApplicationVersion();
  const createEnv = useCreateEnvironment();
  const deleteEnv = useDeleteEnvironment();

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [versionDesc, setVersionDesc] = useState("");
  const [showCreateEnv, setShowCreateEnv] = useState(false);
  const [envName, setEnvName] = useState("");
  const [envDesc, setEnvDesc] = useState("");
  const [envVersion, setEnvVersion] = useState("");
  const [envStack, setEnvStack] = useState("");

  const versionsQuery = useApplicationVersions(selectedApp);
  const envsQuery = useEnvironments(selectedApp);
  const selectedEnv = envsQuery.data?.environments?.[0]?.environmentName || null;
  const configQuery = useConfigurationSettings(selectedApp, selectedEnv);

  const apps = (appsQuery.data?.applications || []).map((a: any) => ({
    name: a.applicationName || "—",
    description: a.description || "—",
    versions: a.versions || 0,
    templates: a.configurationTemplates || 0,
    created: a.dateCreated ? new Date(a.dateCreated).toLocaleDateString() : "—",
  }));

  const versions = (versionsQuery.data?.versions || []).map((v: any) => ({
    label: v.versionLabel || "—",
    description: v.description || "—",
    status: v.status || "—",
    created: v.dateCreated ? new Date(v.dateCreated).toLocaleDateString() : "—",
  }));

  const envs = (envsQuery.data?.environments || []).map((e: any) => ({
    name: e.environmentName || "—",
    id: e.environmentId || "—",
    description: e.description || "",
    version: e.versionLabel || "—",
    stack: e.solutionStackName || "—",
    status: e.status || "—",
    health: e.health || "—",
    cname: e.cname || "—",
    created: e.dateCreated ? new Date(e.dateCreated).toLocaleDateString() : "—",
  }));

  if (appsQuery.isLoading) return <TableSkeleton />;

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "applications",
            label: `Applications (${appsQuery.data?.total || 0})`,
            content: (
              <SpaceBetween size="l">
                <ResourceTable
                  resourceName="Application"
                  headerTitle="Elastic Beanstalk Applications"
                  headerCounter={appsQuery.data?.total}
                  items={apps}
                  columns={[
                    {
                      id: "name",
                      header: "Name",
                      cell: (i: any) => (
                        <Button variant="link" onClick={() => setSelectedApp(i.name === selectedApp ? null : i.name)}>
                          {i.name}
                        </Button>
                      ),
                      isRowHeader: true,
                    },
                    { id: "description", header: "Description", cell: (i: any) => i.description },
                    { id: "versions", header: "Versions", cell: (i: any) => i.versions },
                    { id: "templates", header: "Templates", cell: (i: any) => i.templates },
                    { id: "created", header: "Created", cell: (i: any) => i.created },
                    {
                      id: "actions",
                      header: "",
                      cell: (i: any) => (
                        <DeleteButton
                          itemName={i.name}
                          resourceType="application"
                          loading={deleteApp.isPending && deleteApp.variables === i.name}
                          onDelete={() => deleteApp.mutateAsync(i.name)}
                        />
                      ),
                    },
                  ]}
                  loading={appsQuery.isLoading}
                  emptyMessage="No applications found. Create one to get started."
                  filterEnabled
                  filterPlaceholder="Find applications by name"
                  filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                  onCreate={() => setShowCreateApp(true)}
                />

                {selectedApp && (
                  <Container
                    header={
                      <Header
                        variant="h3"
                        counter={envsQuery.data?.total}
                        actions={
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => setShowCreateVersion(true)}>Create version</Button>
                            <Button onClick={() => setShowCreateEnv(true)}>Create environment</Button>
                          </SpaceBetween>
                        }
                      >
                        Environments — {selectedApp}
                      </Header>
                    }
                  >
                    <ResourceTable
                      resourceName="Environment"
                      items={envs}
                      columns={[
                        { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
                        {
                          id: "health",
                          header: "Health",
                          cell: (i: any) => (
                            <StatusIndicator
                              type={i.health === "Green" ? "success" : i.health === "Yellow" ? "warning" : "error"}
                            >
                              {i.health}
                            </StatusIndicator>
                          ),
                        },
                        { id: "status", header: "Status", cell: (i: any) => i.status },
                        { id: "version", header: "Version", cell: (i: any) => i.version },
                        { id: "stack", header: "Stack", cell: (i: any) => i.stack },
                        { id: "cname", header: "CNAME", cell: (i: any) => i.cname },
                        {
                          id: "actions",
                          header: "",
                          cell: (i: any) => (
                            <DeleteButton
                              itemName={i.name}
                              resourceType="environment"
                              loading={deleteEnv.isPending && deleteEnv.variables === i.name}
                              onDelete={() => deleteEnv.mutateAsync(i.name)}
                            />
                          ),
                        },
                      ]}
                      loading={envsQuery.isLoading}
                      emptyMessage="No environments for this application."
                      filterEnabled
                      filterPlaceholder="Find environments"
                      filterFunction={(i: any, s: string) => i.name.toLowerCase().includes(s.toLowerCase())}
                    />
                  </Container>
                )}

                {selectedApp && (
                  <Container
                    header={
                      <Header variant="h3" counter={versionsQuery.data?.total}>
                        Application Versions — {selectedApp}
                      </Header>
                    }
                  >
                    <ResourceTable
                      resourceName="Version"
                      items={versions}
                      columns={[
                        { id: "label", header: "Version Label", cell: (i: any) => i.label, isRowHeader: true },
                        { id: "description", header: "Description", cell: (i: any) => i.description },
                        { id: "status", header: "Status", cell: (i: any) => i.status },
                        { id: "created", header: "Created", cell: (i: any) => i.created },
                        {
                          id: "actions",
                          header: "",
                          cell: (i: any) => (
                            <DeleteButton
                              itemName={i.label}
                              resourceType="version"
                              loading={deleteVersion.isPending && (deleteVersion.variables as any)?.versionLabel === i.label}
                              onDelete={() => deleteVersion.mutateAsync({ appName: selectedApp, versionLabel: i.label })}
                            />
                          ),
                        },
                      ]}
                      loading={versionsQuery.isLoading}
                      emptyMessage="No versions for this application."
                      filterEnabled
                      filterPlaceholder="Find versions"
                      filterFunction={(i: any, s: string) => i.label.toLowerCase().includes(s.toLowerCase())}
                    />
                  </Container>
                )}

                <Modal
                  visible={showCreateApp}
                  onDismiss={() => setShowCreateApp(false)}
                  header="Create application"
                  footer={
                    <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => setShowCreateApp(false)}>Cancel</Button>
                        <Button
                          variant="primary"
                          loading={createApp.isPending}
                          disabled={!appName.trim()}
                          onClick={() => {
                            createApp.mutate(
                              { applicationName: appName.trim(), description: appDesc.trim() || undefined },
                              { onSuccess: () => { setShowCreateApp(false); setAppName(""); setAppDesc(""); } }
                            );
                          }}
                        >
                          Create
                        </Button>
                      </SpaceBetween>
                    </Box>
                  }
                >
                  <Form>
                    {createApp.isError && (
                      <Alert type="error" dismissible>
                        {(createApp.error as Error)?.message || "Failed to create application"}
                      </Alert>
                    )}
                    <SpaceBetween size="m">
                      <FormField label="Application name" description="A unique name for your application.">
                        <Input value={appName} onChange={({ detail }) => setAppName(detail.value)} placeholder="my-app" />
                      </FormField>
                      <FormField label="Description (optional)">
                        <Input value={appDesc} onChange={({ detail }) => setAppDesc(detail.value)} placeholder="My application" />
                      </FormField>
                    </SpaceBetween>
                  </Form>
                </Modal>

                {selectedApp && (
                  <Modal
                    visible={showCreateVersion}
                    onDismiss={() => setShowCreateVersion(false)}
                    header={`Create version: ${selectedApp}`}
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateVersion(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createVersion.isPending}
                            disabled={!versionLabel.trim()}
                            onClick={() => {
                              createVersion.mutate(
                                { appName: selectedApp, versionLabel: versionLabel.trim(), description: versionDesc.trim() || undefined },
                                { onSuccess: () => { setShowCreateVersion(false); setVersionLabel(""); setVersionDesc(""); } }
                              );
                            }}
                          >
                            Create
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      {createVersion.isError && (
                        <Alert type="error" dismissible>
                          {(createVersion.error as Error)?.message || "Failed to create version"}
                        </Alert>
                      )}
                      <SpaceBetween size="m">
                        <FormField label="Version label">
                          <Input value={versionLabel} onChange={({ detail }) => setVersionLabel(detail.value)} placeholder="v1.0.0" />
                        </FormField>
                        <FormField label="Description (optional)">
                          <Input value={versionDesc} onChange={({ detail }) => setVersionDesc(detail.value)} placeholder="Initial version" />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                )}

                {selectedApp && (
                  <Modal
                    visible={showCreateEnv}
                    onDismiss={() => setShowCreateEnv(false)}
                    header={`Create environment: ${selectedApp}`}
                    footer={
                      <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button variant="link" onClick={() => setShowCreateEnv(false)}>Cancel</Button>
                          <Button
                            variant="primary"
                            loading={createEnv.isPending}
                            disabled={!envName.trim()}
                            onClick={() => {
                              createEnv.mutate(
                                {
                                  appName: selectedApp,
                                  environmentName: envName.trim(),
                                  description: envDesc.trim() || undefined,
                                  versionLabel: envVersion.trim() || undefined,
                                  solutionStackName: envStack.trim() || undefined,
                                },
                                { onSuccess: () => { setShowCreateEnv(false); setEnvName(""); setEnvDesc(""); setEnvVersion(""); setEnvStack(""); } }
                              );
                            }}
                          >
                            Create
                          </Button>
                        </SpaceBetween>
                      </Box>
                    }
                  >
                    <Form>
                      {createEnv.isError && (
                        <Alert type="error" dismissible>
                          {(createEnv.error as Error)?.message || "Failed to create environment"}
                        </Alert>
                      )}
                      <SpaceBetween size="m">
                        <FormField label="Environment name">
                          <Input value={envName} onChange={({ detail }) => setEnvName(detail.value)} placeholder="my-env" />
                        </FormField>
                        <FormField label="Description (optional)">
                          <Input value={envDesc} onChange={({ detail }) => setEnvDesc(detail.value)} placeholder="Production environment" />
                        </FormField>
                        <FormField label="Version label (optional)">
                          <Input value={envVersion} onChange={({ detail }) => setEnvVersion(detail.value)} placeholder="v1.0.0" />
                        </FormField>
                        <FormField label="Solution stack (optional)">
                          <Input value={envStack} onChange={({ detail }) => setEnvStack(detail.value)} placeholder="64bit Amazon Linux 2023 v4.0.0 running Node.js 20" />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Modal>
                )}
              </SpaceBetween>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
