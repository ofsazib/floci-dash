import { useState } from "react";
import type { ReactNode } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  FormField,
  Input,
  Alert,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ResourceTable from "../../components/ResourceTable";
import {
  useSesCreateExportJob,
  useSesListExportJobs,
  useSesCancelExportJob,
  useSesCreateImportJob,
  useSesListImportJobs,
  useSesBatchGetMetricData,
  useSesMessageInsights,
  useSesListDedicatedIps,
  useSesPutPoolScaling,
  useSesCreateTenant,
  useSesListTenants,
  useSesDeleteTenant,
  type SesExportJob,
  type SesImportJob,
  type SesTenant,
} from "../../hooks/useSesV2Extras";

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

function ResourceTableLite<T extends object>(props: {
  emptyMessage: string;
  items: T[];
  columns: { id: string; header: string; render: (item: T) => unknown }[];
  rowAction?: (item: T) => ReactNode;
}) {
  return (
    <ResourceTable
      resourceName="entry"
      headerTitle=""
      items={props.items}
      emptyMessage={props.emptyMessage}
      columns={[
        ...props.columns.map((c) => ({
          id: c.id,
          header: c.header,
          cell: (item: T) => c.render(item) as any,
        })),
        ...(props.rowAction
          ? [
              {
                id: "actions",
                header: "",
                cell: (item: T) => props.rowAction!(item),
              },
            ]
          : []),
      ]}
    />
  );
}

export default function SesExtrasPanel() {
  const createExportJob = useSesCreateExportJob();
  const listExportJobs = useSesListExportJobs();
  const cancelExportJob = useSesCancelExportJob();
  const createImportJob = useSesCreateImportJob();
  const listImportJobs = useSesListImportJobs();
  const batchGetMetricData = useSesBatchGetMetricData();
  const messageInsights = useSesMessageInsights();
  const listDedicatedIps = useSesListDedicatedIps();
  const putPoolScaling = useSesPutPoolScaling();
  const createTenant = useSesCreateTenant();
  const listTenants = useSesListTenants();
  const deleteTenant = useSesDeleteTenant();

  const [status, setStatus] = useState<Status | null>(null);
  const [exportJobs, setExportJobs] = useState<SesExportJob[] | null>(null);
  const [importJobs, setImportJobs] = useState<SesImportJob[] | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenants, setTenants] = useState<SesTenant[] | null>(null);
  const [poolName, setPoolName] = useState("");
  const [scalingMode, setScalingMode] = useState("MANAGED");
  const [dedicatedIps, setDedicatedIps] = useState<
    { ip?: string; status?: string }[] | null
  >(null);
  const [metricResult, setMetricResult] = useState<string | null>(null);
  const [insightsMessageId, setInsightsMessageId] = useState("");
  const [insights, setInsights] = useState<string | null>(null);

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
      <Container header={<Header variant="h3">Export jobs</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <Button
              loading={createExportJob.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    await createExportJob.mutateAsync({
                      exportDestination: { dataFormat: "CSV" },
                      exportDataSource: {
                        metricsDataSource: { dimensions: {} },
                      },
                    });
                  },
                  "Export job created."
                )
              }
            >
              Create CSV export
            </Button>
            <Button
              loading={listExportJobs.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await listExportJobs.mutateAsync();
                    setExportJobs(result.jobs);
                  },
                  "Export jobs loaded."
                )
              }
            >
              List export jobs
            </Button>
          </SpaceBetween>
          {exportJobs && (
            <ResourceTableLite
              emptyMessage="No export jobs"
              items={exportJobs}
              columns={[
                { id: "id", header: "Job ID", render: (j: SesExportJob) => j.jobId },
                { id: "status", header: "Status", render: (j: SesExportJob) => j.jobStatus },
              ]}
              rowAction={(j: SesExportJob) => (
                <Button
                  loading={cancelExportJob.isPending}
                  onClick={() =>
                    wrap(
                      () => cancelExportJob.mutateAsync(j.jobId!),
                      `Export job ${j.jobId} cancelled.`
                    )
                  }
                >
                  Cancel
                </Button>
              )}
            />
          )}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">Import jobs</Header>}>
        <SpaceBetween size="m">
          <Button
            loading={createImportJob.isPending}
            onClick={() =>
              wrap(
                async () => {
                  await createImportJob.mutateAsync({
                    importDataSource: {
                      s3Url: "s3://floci-import/sample.csv",
                      dataFormat: "CSV",
                    },
                    importDestination: {
                      suppressionListDestination: { suppressionListImportAction: "PUT" },
                    },
                  });
                },
                "Import job created."
              )
            }
          >
            Create suppression import
          </Button>
          <Button
            loading={listImportJobs.isPending}
            onClick={() =>
              wrap(
                async () => {
                  const result = await listImportJobs.mutateAsync();
                  setImportJobs(result.importJobs);
                },
                "Import jobs loaded."
              )
            }
          >
            List import jobs
          </Button>
          {importJobs && (
            <ResourceTableLite
              emptyMessage="No import jobs"
              items={importJobs}
              columns={[
                { id: "id", header: "Job ID", render: (j: SesImportJob) => j.jobId },
                {
                  id: "status",
                  header: "Status",
                  render: (j: SesImportJob) => j.importJobStatus,
                },
              ]}
            />
          )}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">VDM metrics & insights</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <Button
              loading={batchGetMetricData.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await batchGetMetricData.mutateAsync([
                      { id: "send-series", metric: "SEND", namespace: "VDM" },
                    ]);
                    setMetricResult(JSON.stringify(result));
                  },
                  "Metric data fetched."
                )
              }
            >
              BatchGetMetricData (SEND)
            </Button>
            <FormField label="Message ID">
              <Input
                value={insightsMessageId}
                onChange={({ detail }) => setInsightsMessageId(detail.value)}
                placeholder="mid-123"
              />
            </FormField>
            <Button
              disabled={!insightsMessageId}
              loading={messageInsights.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await messageInsights.mutateAsync(insightsMessageId);
                    setInsights(JSON.stringify(result.insights));
                  },
                  "Insights fetched."
                )
              }
            >
              Get insights
            </Button>
          </SpaceBetween>
          {metricResult && <Box>{metricResult}</Box>}
          {insights && <Box>{insights}</Box>}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">Dedicated IPs</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Pool name">
              <Input
                value={poolName}
                onChange={({ detail }) => setPoolName(detail.value)}
                placeholder="my-pool"
              />
            </FormField>
            <Button
              disabled={!poolName}
              loading={listDedicatedIps.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await listDedicatedIps.mutateAsync(poolName);
                    setDedicatedIps(result.dedicatedIps);
                  },
                  "Dedicated IPs loaded."
                )
              }
            >
              List IPs
            </Button>
            <FormField label="Scaling mode">
              <Input
                value={scalingMode}
                onChange={({ detail }) => setScalingMode(detail.value)}
              />
            </FormField>
            <Button
              disabled={!poolName}
              loading={putPoolScaling.isPending}
              onClick={() =>
                wrap(
                  () => putPoolScaling.mutateAsync({ name: poolName, scalingMode }),
                  `Scaling mode of ${poolName} set to ${scalingMode}.`
                )
              }
            >
              Set scaling
            </Button>
          </SpaceBetween>
          {dedicatedIps && (
            <ResourceTableLite
              emptyMessage="No dedicated IPs (Floci does not model leased IPs)"
              items={dedicatedIps}
              columns={[
                { id: "ip", header: "IP", render: (i: { ip?: string }) => i.ip },
                {
                  id: "status",
                  header: "Status",
                  render: (i: { ip?: string; status?: string }) => i.status,
                },
              ]}
            />
          )}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">Tenants</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Tenant name">
              <Input
                value={tenantName}
                onChange={({ detail }) => setTenantName(detail.value)}
                placeholder="marketing"
              />
            </FormField>
            <Button
              disabled={!tenantName}
              loading={createTenant.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    await createTenant.mutateAsync({ tenantName });
                  },
                  `Tenant ${tenantName} created.`
                )
              }
            >
              Create
            </Button>
            <Button
              loading={listTenants.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await listTenants.mutateAsync();
                    setTenants(result.tenants);
                  },
                  "Tenants loaded."
                )
              }
            >
              List tenants
            </Button>
          </SpaceBetween>
          {tenants && (
            <ResourceTableLite
              emptyMessage="No tenants"
              items={tenants}
              columns={[
                { id: "name", header: "Tenant", render: (t: SesTenant) => t.tenantName },
                { id: "arn", header: "ARN", render: (t: SesTenant) => t.tenantArn },
              ]}
              rowAction={(t: SesTenant) => (
                <Button
                  loading={deleteTenant.isPending}
                  onClick={() =>
                    wrap(
                      async () => {
                        await deleteTenant.mutateAsync(t.tenantName!);
                        setTenants((prev) =>
                          prev.filter((x) => x.tenantName !== t.tenantName)
                        );
                      },
                      `Tenant ${t.tenantName} deleted.`
                    )
                  }
                >
                  Delete
                </Button>
              )}
            />
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
