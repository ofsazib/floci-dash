import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BreadcrumbGroup,
  ContentLayout,
  Header,
  Box,
  SpaceBetween,
  Table,
  Button,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  SelectProps,
  Tabs,
  type TabsProps,
  Badge,
  ColumnLayout,
  Container,
  Textarea,
} from "@cloudscape-design/components";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useHealth } from "../hooks/useSystem";
import {
  useCloudWatchMetrics,
  usePutMetricData,
  useMetricStatistics,
  useCloudWatchAlarms,
  useCreateAlarm,
  useDeleteAlarm,
  useSetAlarmState,
} from "../hooks/useCloudWatch";

const COMPARISON_OPERATORS = [
  { label: "GreaterThanOrEqualToThreshold", value: "GreaterThanOrEqualToThreshold" },
  { label: "GreaterThanThreshold", value: "GreaterThanThreshold" },
  { label: "LessThanThreshold", value: "LessThanThreshold" },
  { label: "LessThanOrEqualToThreshold", value: "LessThanOrEqualToThreshold" },
];

const STATISTICS = [
  { label: "Average", value: "Average" },
  { label: "Sum", value: "Sum" },
  { label: "Minimum", value: "Minimum" },
  { label: "Maximum", value: "Maximum" },
  { label: "SampleCount", value: "SampleCount" },
];

const UNITS = [
  { label: "None", value: "None" },
  { label: "Count", value: "Count" },
  { label: "Percent", value: "Percent" },
  { label: "Seconds", value: "Seconds" },
  { label: "Bytes", value: "Bytes" },
  { label: "Megabytes", value: "Megabytes" },
];

const ALARM_STATES: Record<string, "red" | "green" | "blue"> = {
  ALARM: "red",
  OK: "green",
  INSUFFICIENT_DATA: "blue",
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <span className="fd-text-muted">-</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 28;
  const step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ verticalAlign: "middle" }}>
      <polyline points={pts} fill="none" stroke="var(--color-text-status-info, #0073bb)" strokeWidth="1.5" />
    </svg>
  );
}

function MetricsTab() {
  const { showToast } = useToast();
  const [selectedNamespace, setSelectedNamespace] = useState<string | undefined>();
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);
  const [showPutModal, setShowPutModal] = useState(false);

  const metricsQuery = useCloudWatchMetrics(selectedNamespace);
  const statsQuery = useMetricStatistics({
    namespace: selectedMetric?.namespace || "",
    metricName: selectedMetric?.metricName || "",
    statistics: "Average,Sum,Minimum,Maximum,SampleCount",
    period: 60,
  });

  const putMetric = usePutMetricData();

  const namespaces = metricsQuery.data?.namespaces || [];
  const metrics = metricsQuery.data?.metrics || [];

  const datapoints = statsQuery.data?.datapoints || [];
  const sparkValues = datapoints.map((d) => d.average ?? d.sum ?? 0).slice(-20);

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2" actions={<Button onClick={() => setShowPutModal(true)}>Put metric data</Button>}>Metrics</Header>}>
        <SpaceBetween size="m">
          <Select
            selectedOption={selectedNamespace ? { label: selectedNamespace, value: selectedNamespace } : null}
            onChange={({ detail }) => {
              setSelectedNamespace(detail.selectedOption?.value || undefined);
              setSelectedMetric(null);
            }}
            options={namespaces.map((n) => ({ label: n, value: n }))}
            placeholder="All namespaces"
          />
          <Table
            columnDefinitions={[
              { id: "namespace", header: "Namespace", cell: (m: any) => m.namespace },
              { id: "metric", header: "Metric", cell: (m: any) => m.metricName },
              { id: "dims", header: "Dimensions", cell: (m: any) => (m.dimensions || []).map((d: any) => `${d.name}=${d.value}`).join(", ") || "-" },
              {
                id: "trend",
                header: "Trend (1h)",
                cell: (m: any) =>
                  selectedMetric?.namespace === m.namespace && selectedMetric?.metricName === m.metricName
                    ? <Sparkline values={sparkValues} />
                    : <span className="fd-text-muted">-</span>,
              },
            ]}
            items={metrics}
            loading={metricsQuery.isLoading}
            trackBy={(m: any) => `${m.namespace}:${m.metricName}:${JSON.stringify(m.dimensions)}`}
            selectedItems={selectedMetric ? [selectedMetric] : []}
            onSelectionChange={({ detail }) => setSelectedMetric(detail.selectedItems[0] || null)}
            empty={<Box textAlign="center" color="inherit"><b>No metrics</b><Box variant="p" color="text-body-secondary">Put metric data to create metrics.</Box></Box>}
          />
        </SpaceBetween>
      </Container>

      {selectedMetric && (
        <Container header={<Header variant="h2">{selectedMetric.namespace} / {selectedMetric.metricName}</Header>}>
          {datapoints.length === 0 ? (
            <Box color="text-body-secondary" textAlign="center">No datapoints in the last hour</Box>
          ) : (
            <SpaceBetween size="m">
              <Box>
                <Sparkline values={sparkValues} />
                <span style={{ marginLeft: 8, fontSize: 13 }} className="fd-text-muted-subtle">{datapoints.length} datapoints</span>
              </Box>
              <Table
                columnDefinitions={[
                  { id: "time", header: "Timestamp", cell: (d: any) => d.timestamp ? new Date(d.timestamp).toLocaleString() : "-" },
                  { id: "avg", header: "Average", cell: (d: any) => d.average?.toFixed(2) ?? "-" },
                  { id: "sum", header: "Sum", cell: (d: any) => d.sum?.toFixed(2) ?? "-" },
                  { id: "min", header: "Min", cell: (d: any) => d.minimum?.toFixed(2) ?? "-" },
                  { id: "max", header: "Max", cell: (d: any) => d.maximum?.toFixed(2) ?? "-" },
                  { id: "sc", header: "SampleCount", cell: (d: any) => d.sampleCount ?? "-" },
                  { id: "unit", header: "Unit", cell: (d: any) => d.unit ?? "-" },
                ]}
                items={datapoints}
                trackBy={(d: any) => d.timestamp}
              />
            </SpaceBetween>
          )}
        </Container>
      )}

      {showPutModal && (
        <PutMetricModal
          namespaces={namespaces}
          onClose={() => setShowPutModal(false)}
          onSubmit={async (data) => {
            try {
              await putMetric.mutateAsync(data);
              showToast("success","Metric data published");
              setShowPutModal(false);
              metricsQuery.refetch();
            } catch (e: any) {
              showToast("error",e.message);
            }
          }}
        />
      )}
    </SpaceBetween>
  );
}

function PutMetricModal({ namespaces, onClose, onSubmit }: {
  namespaces: string[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [namespace, setNamespace] = useState<string>("");
  const [metricName, setMetricName] = useState<string>("");
  const [value, setValue] = useState<string>("1");
  const [unit, setUnit] = useState<SelectProps.Option>({ label: "Count", value: "Count" });

  return (
    <Modal visible={true} onDismiss={onClose} header="Put metric data" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({
          namespace,
          metricData: [{ metricName, value: parseFloat(value as string), unit: unit.value }],
        })}>Publish</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Namespace">
            <Select
              selectedOption={namespace ? { label: namespace, value: namespace } : null}
              onChange={({ detail }) => setNamespace(detail.selectedOption?.value || "")}
              options={[...namespaces.map((n) => ({ label: n, value: n })), { label: "AWS/Lambda", value: "AWS/Lambda" }, { label: "AWS/EC2", value: "AWS/EC2" }, { label: "Custom", value: "Custom" }]}
              placeholder="Select namespace"
            />
          </FormField>
          <FormField label="Metric name">
            <Input value={metricName} onChange={({ detail }) => setMetricName(detail.value)} placeholder="MyMetric" />
          </FormField>
          <FormField label="Value">
            <Input type="number" value={value} onChange={({ detail }) => setValue(detail.value)} />
          </FormField>
          <FormField label="Unit">
            <Select
              selectedOption={unit}
              onChange={({ detail }) => setUnit(detail.selectedOption)}
              options={UNITS}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function AlarmsTab() {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [stateFilter, setStateFilter] = useState<string | undefined>();

  const alarmsQuery = useCloudWatchAlarms(stateFilter);
  const deleteAlarm = useDeleteAlarm();
  const setAlarmState = useSetAlarmState();
  const createAlarm = useCreateAlarm();

  const alarms = alarmsQuery.data?.alarms || [];

  return (
    <SpaceBetween size="l">
      <Table
        header={
          <Header
            variant="h2"
            counter={`(${alarms.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Select
                  selectedOption={stateFilter ? { label: stateFilter, value: stateFilter } : null}
                  onChange={({ detail }) => setStateFilter(detail.selectedOption?.value)}
                  options={[
                    { label: "All", value: "" },
                    { label: "OK", value: "OK" },
                    { label: "ALARM", value: "ALARM" },
                    { label: "INSUFFICIENT_DATA", value: "INSUFFICIENT_DATA" },
                  ]}
                  placeholder="Filter by state"
                />
                <Button onClick={() => setShowCreate(true)}>Create alarm</Button>
              </SpaceBetween>
            }
          >
            Alarms
          </Header>
        }
        columnDefinitions={[
          {
            id: "state",
            header: "State",
            cell: (a: any) => (
              <Badge color={ALARM_STATES[a.state] || "blue"}>
                {a.state || "INSUFFICIENT_DATA"}
              </Badge>
            ),
          },
          { id: "name", header: "Name", cell: (a: any) => a.name },
          { id: "metric", header: "Metric", cell: (a: any) => a.namespace ? `${a.namespace}/${a.metricName}` : "-" },
          { id: "threshold", header: "Threshold", cell: (a: any) => a.threshold != null ? `${a.comparisonOperator || ""} ${a.threshold}` : "-" },
          { id: "period", header: "Period", cell: (a: any) => a.period ? `${a.period}s` : "-" },
          { id: "stat", header: "Statistic", cell: (a: any) => a.statistic || "-" },
          {
            id: "actions",
            header: "",
            cell: (a: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                {a.state !== "OK" && (
                  <Button
                    onClick={async () => {
                      try {
                        await setAlarmState.mutateAsync({ name: a.name, state: "OK", reason: "Manually set to OK" });
                        showToast("success",`Alarm ${a.name} set to OK`);
                      } catch (e: any) { showToast("error",e.message); }
                    }}
                  >
                    Set OK
                  </Button>
                )}
                <DeleteButton
                  itemName={a.name}
                  resourceType="alarm"
                  onDelete={async () => {
                    try {
                      await deleteAlarm.mutateAsync(a.name);
                      showToast("success",`Alarm ${a.name} deleted`);
                    } catch (e: any) { showToast("error",e.message); }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
        items={alarms}
        loading={alarmsQuery.isLoading}
        trackBy={(a: any) => a.name}
        empty={<Box textAlign="center" color="inherit"><b>No alarms</b><Box variant="p" color="text-body-secondary">Create an alarm to get started.</Box></Box>}
      />

      {showCreate && (
        <CreateAlarmModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (data) => {
            try {
              await createAlarm.mutateAsync(data);
              showToast("success","Alarm created");
              setShowCreate(false);
            } catch (e: any) { showToast("error",e.message); }
          }}
        />
      )}
    </SpaceBetween>
  );
}

function CreateAlarmModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [name, setName] = useState<string>("");
  const [namespace, setNamespace] = useState<string>("");
  const [metricName, setMetricName] = useState<string>("");
  const [statistic, setStatistic] = useState<SelectProps.Option>(STATISTICS[0]);
  const [threshold, setThreshold] = useState<string>("0");
  const [comparison, setComparison] = useState<SelectProps.Option>(COMPARISON_OPERATORS[0]);
  const [period, setPeriod] = useState<string>("60");
  const [evalPeriods, setEvalPeriods] = useState<string>("1");
  const [description, setDescription] = useState<string>("");

  return (
    <Modal visible={true} onDismiss={onClose} header="Create alarm" footer={
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSubmit({
          name, namespace, metricName,
          statistic: statistic.value,
          threshold: parseFloat(threshold as string),
          comparisonOperator: comparison.value,
          period: parseInt(period as string),
          evaluationPeriods: parseInt(evalPeriods as string),
          description,
        })}>Create</Button>
      </SpaceBetween>
    }>
      <Form>
        <SpaceBetween size="m">
          <FormField label="Alarm name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
          <FormField label="Namespace">
            <Input value={namespace} onChange={({ detail }) => setNamespace(detail.value)} placeholder="AWS/EC2" />
          </FormField>
          <FormField label="Metric name">
            <Input value={metricName} onChange={({ detail }) => setMetricName(detail.value)} placeholder="CPUUtilization" />
          </FormField>
          <ColumnLayout columns={2}>
            <FormField label="Statistic">
              <Select selectedOption={statistic} onChange={({ detail }) => setStatistic(detail.selectedOption)} options={STATISTICS} />
            </FormField>
            <FormField label="Comparison">
              <Select selectedOption={comparison} onChange={({ detail }) => setComparison(detail.selectedOption)} options={COMPARISON_OPERATORS} />
            </FormField>
            <FormField label="Threshold">
              <Input type="number" value={threshold} onChange={({ detail }) => setThreshold(detail.value)} />
            </FormField>
            <FormField label="Period (seconds)">
              <Input type="number" value={period} onChange={({ detail }) => setPeriod(detail.value)} />
            </FormField>
            <FormField label="Evaluation periods">
              <Input type="number" value={evalPeriods} onChange={({ detail }) => setEvalPeriods(detail.value)} />
            </FormField>
          </ColumnLayout>
          <FormField label="Description">
            <Textarea value={description} onChange={({ detail }) => setDescription(detail.value)} rows={2} />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

export default function CloudWatchPage() {
  const navigate = useNavigate();
  const { data: health } = useHealth();
  const [activeTab, setActiveTab] = useState("alarms");

  const cwStatus = health?.services?.cloudwatch;
  const statusText = cwStatus === "running" ? "running" : cwStatus === "available" ? "available" : "connected";

  const tabs: TabsProps.Tab[] = [
    { id: "alarms", label: "Alarms", content: <AlarmsTab /> },
    { id: "metrics", label: "Metrics", content: <MetricsTab /> },
  ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: "CloudWatch", href: "/#/services/cloudwatch" },
            ]}
            onFollow={(e) => { e.preventDefault(); navigate(e.detail.href.replace("/#", "")); }}
          />
          <Header variant="h1" description="CloudWatch metrics and alarms">
            CloudWatch <StatusBadge status={statusText as any} />
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs tabs={tabs} activeTabId={activeTab} onChange={({ detail }) => setActiveTab(detail.activeTabId)} />
    </ContentLayout>
  );
}
