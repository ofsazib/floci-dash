import { useState } from "react";
import {
  ContentLayout,
  Header,
  Box,
  BreadcrumbGroup,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  Tabs,
  Textarea,
  ColumnLayout,
  Container,
  type TabsProps,
} from "@cloudscape-design/components";
import {
  useLambdaFunctions,
  useLambdaFunction,
  useCreateFunction,
  useDeleteFunction,
  useInvokeFunction,
  useLambdaVersions,
  usePublishVersion,
  useLambdaAliases,
  useEventSourceMappings,
  useLambdaLayers,
  useDeleteLayerVersion,
  useFunctionUrl,
  useFunctionConcurrency,
} from "../hooks/useLambda";
import ResourceTable from "../components/ResourceTable";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";

const RUNTIMES = [
  "nodejs22.x", "nodejs20.x", "nodejs18.x",
  "python3.13", "python3.12", "python3.11", "python3.10", "python3.9",
  "java21", "java17", "java11",
  "go1.x", "ruby3.3", "ruby3.2",
  "dotnet8", "provided.al2023", "provided.al2",
].map((r) => ({ label: r, value: r }));

export default function LambdaPage() {
  const [selectedTab, setSelectedTab] = useState("functions");
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  if (selectedFunction) {
    return (
      <LambdaFunctionDetail
        name={selectedFunction}
        onBack={() => setSelectedFunction(null)}
      />
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "functions",
      label: "Functions",
      content: <LambdaFunctionList onSelect={(name) => setSelectedFunction(name)} />,
    },
    {
      id: "layers",
      label: "Layers",
      content: <LambdaLayerList />,
    },
  ];

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Serverless compute — run code without provisioning servers"
        >
          Lambda <StatusBadge status="available" />
        </Header>
      }
      breadcrumbs={
        <BreadcrumbGroup
          items={[{ text: "Dashboard", href: "#/" }, { text: "Lambda", href: "#/services/lambda" }]}
          onFollow={(e) => { e.preventDefault(); window.location.hash = e.detail.href.replace("#", ""); }}
        />
      }
    >
      <Tabs
        activeTabId={selectedTab}
        onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
        tabs={tabs}
      />
    </ContentLayout>
  );
}

// ─── FUNCTION LIST ──────────────────────────────────────

function LambdaFunctionList({ onSelect }: { onSelect: (name: string) => void }) {
  const { data, isLoading, isError, error } = useLambdaFunctions();
  const deleteFunction = useDeleteFunction();
  const [showCreate, setShowCreate] = useState(false);
  const createFunction = useCreateFunction();
  const [form, setForm] = useState({
    name: "",
    runtime: "nodejs22.x",
    handler: "index.handler",
    timeout: 3,
    memorySize: 128,
    description: "",
  });

  const items = (data?.functions || []).map((f: any) => ({
    name: f.name,
    runtime: f.runtime,
    handler: f.handler,
    timeout: f.timeout,
    memorySize: f.memorySize,
    lastModified: f.lastModified,
    codeSize: f.codeSize,
    state: f.state,
  }));

  function handleCreate() {
    if (!form.name || !form.handler) return;
    createFunction.mutate(
      {
        name: form.name,
        runtime: form.runtime,
        handler: form.handler,
        timeout: Number(form.timeout),
        memorySize: Number(form.memorySize),
        description: form.description,
        zipFile: Buffer.from("UEsDBBQAAAAAA").toString("base64"),
      },
      { onSuccess: () => setShowCreate(false) }
    );
  }

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load functions"}</StatusIndicator>}
      <ResourceTable
        resourceName="Function"
        headerTitle="Functions"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "name", header: "Function name", cell: (item: any) => <Button variant="link" onClick={() => onSelect(item.name)}>{item.name}</Button>, isRowHeader: true },
          { id: "runtime", header: "Runtime", cell: (item: any) => item.runtime || "-" },
          { id: "handler", header: "Handler", cell: (item: any) => item.handler || "-" },
          { id: "memory", header: "Memory (MB)", cell: (item: any) => item.memorySize || "-" },
          { id: "timeout", header: "Timeout (s)", cell: (item: any) => item.timeout || "-" },
          { id: "state", header: "State", cell: (item: any) => (
            <StatusIndicator type={item.state === "Active" ? "success" : item.state === "Failed" ? "error" : "in-progress"}>
              {item.state || "Active"}
            </StatusIndicator>
          )},
          { id: "lastModified", header: "Last modified", cell: (item: any) => item.lastModified ? new Date(item.lastModified).toLocaleString() : "-" },
          { id: "actions", header: "", cell: (item: any) => (
            <DeleteButton itemName={item.name} resourceType="function" loading={deleteFunction.isPending} onDelete={() => deleteFunction.mutateAsync(item.name)} />
          )},
        ]}
        loading={isLoading}
        emptyMessage="No functions found"
        filterEnabled
        filterPlaceholder="Find functions by name"
        filterFunction={(item: any, t: string) => item.name?.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create function"
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={createFunction.isPending} disabled={!form.name || !form.handler} onClick={handleCreate}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Form>
          {createFunction.isError && <Alert type="error" dismissible>{(createFunction.error as Error)?.message || "Failed to create function"}</Alert>}
          <SpaceBetween size="m">
            <FormField label="Function name">
              <Input value={form.name} onChange={({ detail }) => setForm(p => ({ ...p, name: detail.value }))} placeholder="my-function" />
            </FormField>
            <FormField label="Runtime">
              <Select
                selectedOption={{ label: form.runtime, value: form.runtime }}
                onChange={({ detail }) => setForm(p => ({ ...p, runtime: detail.selectedOption.value || "nodejs22.x" }))}
                options={RUNTIMES}
              />
            </FormField>
            <FormField label="Handler">
              <Input value={form.handler} onChange={({ detail }) => setForm(p => ({ ...p, handler: detail.value }))} placeholder="index.handler" />
            </FormField>
            <FormField label="Description">
              <Input value={form.description} onChange={({ detail }) => setForm(p => ({ ...p, description: detail.value }))} placeholder="Optional description" />
            </FormField>
            <FormField label="Timeout (seconds)">
              <Input type="number" value={String(form.timeout)} onChange={({ detail }) => setForm(p => ({ ...p, timeout: Number(detail.value) || 3 }))} />
            </FormField>
            <FormField label="Memory (MB)">
              <Input type="number" value={String(form.memorySize)} onChange={({ detail }) => setForm(p => ({ ...p, memorySize: Number(detail.value) || 128 }))} />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── FUNCTION DETAIL ────────────────────────────────────

function LambdaFunctionDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const { data, isLoading, isError, error } = useLambdaFunction(name);
  const [tab, setTab] = useState("config");
  const [invokePayload, setInvokePayload] = useState('{\n  "key": "value"\n}');
  const invokeFunction = useInvokeFunction();
  const { data: versions } = useLambdaVersions(name);
  const { data: aliases } = useLambdaAliases(name);
  const { data: esm } = useEventSourceMappings(name);
  const { data: urlConfig } = useFunctionUrl(name);
  const { data: concurrency } = useFunctionConcurrency(name);
  const publishVersion = usePublishVersion();

  if (isLoading) return <StatusIndicator type="loading">Loading function details...</StatusIndicator>;
  if (isError) return <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>;
  if (!data) return null;
  const cfg = data.configuration;

  const detailTabs: TabsProps.Tab[] = [
    {
      id: "config",
      label: "Configuration",
      content: (
        <Container>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box fontSize="body-s" color="text-label">Runtime</Box>
              <Box fontSize="body-m">{cfg.runtime || "N/A"}</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Handler</Box>
              <Box fontSize="body-m">{cfg.handler || "N/A"}</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Timeout</Box>
              <Box fontSize="body-m">{cfg.timeout || 3}s</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Memory</Box>
              <Box fontSize="body-m">{cfg.memorySize || 128} MB</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Code size</Box>
              <Box fontSize="body-m">{cfg.codeSize ? `${(cfg.codeSize / 1024).toFixed(1)} KB` : "N/A"}</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Last modified</Box>
              <Box fontSize="body-m">{cfg.lastModified ? new Date(cfg.lastModified).toLocaleString() : "N/A"}</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">State</Box>
              <StatusIndicator type={cfg.state === "Active" ? "success" : cfg.state === "Failed" ? "error" : "in-progress"}>
                {cfg.state || "Active"}
              </StatusIndicator>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Reserved concurrency</Box>
              <Box fontSize="body-m">{concurrency?.reservedConcurrentExecutions ?? "Not set"}</Box>
            </div>
            <div>
              <Box fontSize="body-s" color="text-label">Architecture</Box>
              <Box fontSize="body-m">{cfg.architectures?.join(", ") || "x86_64"}</Box>
            </div>
          </ColumnLayout>

          {cfg.environment && Object.keys(cfg.environment).length > 0 && (
            <Box padding={{ top: "l" }}>
              <Box fontSize="body-s" color="text-label" padding={{ bottom: "xs" }}>Environment variables</Box>
              <ColumnLayout columns={2} variant="text-grid">
                {Object.entries(cfg.environment).map(([k, v]) => (
                  <div key={k}>
                    <Box fontSize="body-s" fontWeight="bold">{k}</Box>
                    <Box fontSize="body-s" color="text-body-secondary">{v as string}</Box>
                  </div>
                ))}
              </ColumnLayout>
            </Box>
          )}

          {cfg.layers && cfg.layers.length > 0 && (
            <Box padding={{ top: "l" }}>
              <Box fontSize="body-s" color="text-label" padding={{ bottom: "xs" }}>Layers</Box>
              {cfg.layers.map((l: any, i: number) => (
                <Box key={i} fontSize="body-s">{l.arn} ({l.codeSize ? `${(l.codeSize / 1024).toFixed(1)} KB` : "unknown"})</Box>
              ))}
            </Box>
          )}

          {urlConfig?.url && (
            <Box padding={{ top: "l" }}>
              <Box fontSize="body-s" color="text-label" padding={{ bottom: "xs" }}>Function URL</Box>
              <Box fontSize="body-s">
                <a href={urlConfig.url} target="_blank" rel="noreferrer">{urlConfig.url}</a>
                <span style={{ marginLeft: "8px", opacity: 0.7 }}>({urlConfig.authType})</span>
              </Box>
            </Box>
          )}
        </Container>
      ),
    },
    {
      id: "invoke",
      label: "Test",
      content: (
        <SpaceBetween size="m">
          {invokeFunction.isError && (
            <Alert type="error" dismissible>{(invokeFunction.error as Error)?.message || "Invocation failed"}</Alert>
          )}
          {invokeFunction.data && (
            <Container header={<Header variant="h3">Response</Header>}>
              <Box>
                <StatusIndicator type={invokeFunction.data.functionError ? "error" : "success"}>
                  Status: {invokeFunction.data.statusCode}
                  {invokeFunction.data.functionError ? ` — ${invokeFunction.data.functionError}` : ""}
                </StatusIndicator>
              </Box>
              <Box padding={{ top: "s" }}>
                <pre className="fd-code-block" style={{
                  background: "var(--color-background-container-secondary, #f2f3f3)",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  overflow: "auto",
                }}>
                  {typeof invokeFunction.data.payload === "string"
                    ? invokeFunction.data.payload
                    : JSON.stringify(invokeFunction.data.payload, null, 2)}
                </pre>
              </Box>
            </Container>
          )}
          <Container header={<Header variant="h3">Test event</Header>}>
            <SpaceBetween size="m">
              <Textarea
                value={invokePayload}
                onChange={({ detail }) => setInvokePayload(detail.value)}
                rows={10}
              />
              <Button
                variant="primary"
                loading={invokeFunction.isPending}
                onClick={() => invokeFunction.mutate({ name, payload: invokePayload })}
              >
                Invoke
              </Button>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      ),
    },
    {
      id: "versions",
      label: `Versions${versions?.total ? ` (${versions.total})` : ""}`,
      content: (
        <ResourceTable
          resourceName="Version"
          headerTitle="Published versions"
          items={versions?.versions || []}
          columns={[
            { id: "version", header: "Version", cell: (item: any) => item.version || "-", isRowHeader: true },
            { id: "lastModified", header: "Last modified", cell: (item: any) => item.lastModified ? new Date(item.lastModified).toLocaleString() : "-" },
            { id: "codeSize", header: "Code size", cell: (item: any) => item.codeSize ? `${(item.codeSize / 1024).toFixed(1)} KB` : "-" },
            { id: "description", header: "Description", cell: (item: any) => item.description || "-" },
          ]}
          emptyMessage="No published versions"
          loading={false}
        />
      ),
    },
    {
      id: "aliases",
      label: `Aliases${aliases?.total ? ` (${aliases.total})` : ""}`,
      content: (
        <ResourceTable
          resourceName="Alias"
          headerTitle="Aliases"
          items={aliases?.aliases || []}
          columns={[
            { id: "name", header: "Name", cell: (item: any) => item.name || "-", isRowHeader: true },
            { id: "version", header: "Function version", cell: (item: any) => item.functionVersion || "-" },
            { id: "description", header: "Description", cell: (item: any) => item.description || "-" },
          ]}
          emptyMessage="No aliases"
          loading={false}
        />
      ),
    },
    {
      id: "esm",
      label: `Triggers${esm?.total ? ` (${esm.total})` : ""}`,
      content: (
        <ResourceTable
          resourceName="Trigger"
          headerTitle="Event source mappings"
          items={esm?.eventSourceMappings || []}
          columns={[
            { id: "source", header: "Event source", cell: (item: any) => item.eventSourceArn || "-", isRowHeader: true },
            { id: "state", header: "State", cell: (item: any) => (
              <StatusIndicator type={item.state === "Enabled" ? "success" : "in-progress"}>{item.state || "Enabling"}</StatusIndicator>
            )},
            { id: "batchSize", header: "Batch size", cell: (item: any) => item.batchSize || "-" },
            { id: "lastResult", header: "Last processing result", cell: (item: any) => item.lastProcessingResult || "-" },
          ]}
          emptyMessage="No event source mappings"
          loading={false}
        />
      ),
    },
  ];

  return (
    <ContentLayout
      header={
        <Header
          variant="h2"
          description={cfg.runtime ? `${cfg.runtime} — ${cfg.handler}` : undefined}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => publishVersion.mutate({ name })} loading={publishVersion.isPending}>
                Publish version
              </Button>
              <DeleteButton itemName={name} resourceType="function" loading={false} onDelete={async () => { onBack(); }} />
            </SpaceBetween>
          }
        >
          {name}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Button variant="link" iconName="arrow-left" onClick={onBack}>Back to Functions</Button>
        <Tabs activeTabId={tab} onChange={({ detail }) => setTab(detail.activeTabId)} tabs={detailTabs} />
      </SpaceBetween>
    </ContentLayout>
  );
}

// ─── LAYERS ─────────────────────────────────────────────

function LambdaLayerList() {
  const { data, isLoading, isError, error } = useLambdaLayers();
  const deleteLayerVersion = useDeleteLayerVersion();

  const items = (data?.layers || []).map((l: any) => ({
    name: l.name,
    arn: l.arn,
    version: l.latestVersion?.version,
    description: l.latestVersion?.description,
    codeSize: l.latestVersion?.codeSize,
    runtimes: l.latestVersion?.compatibleRuntimes,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load layers"}</StatusIndicator>}
      <ResourceTable
        resourceName="Layer"
        headerTitle="Layers"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "name", header: "Layer name", cell: (item: any) => item.name, isRowHeader: true },
          { id: "version", header: "Latest version", cell: (item: any) => item.version || "-" },
          { id: "description", header: "Description", cell: (item: any) => item.description || "-" },
          { id: "codeSize", header: "Code size", cell: (item: any) => item.codeSize ? `${(item.codeSize / 1024).toFixed(1)} KB` : "-" },
          { id: "runtimes", header: "Compatible runtimes", cell: (item: any) => (item.runtimes || []).join(", ") || "-" },
          { id: "actions", header: "", cell: (item: any) => (
            item.version ? (
              <DeleteButton
                itemName={`${item.name}:${item.version}`}
                resourceType="layer version"
                loading={deleteLayerVersion.isPending}
                onDelete={() => deleteLayerVersion.mutateAsync({ name: item.name, version: item.version })}
              />
            ) : null
          )},
        ]}
        loading={isLoading}
        emptyMessage="No layers found"
        filterEnabled
        filterPlaceholder="Find layers by name"
        filterFunction={(item: any, t: string) => item.name?.toLowerCase().includes(t.toLowerCase())}
      />
    </>
  );
}
