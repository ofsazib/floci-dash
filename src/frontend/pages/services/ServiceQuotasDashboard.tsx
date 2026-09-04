import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  SpaceBetween,
  Tabs,
} from "@cloudscape-design/components";
import {
  useServiceQuotas,
  useRequestServiceQuotaIncrease,
  type ServiceQuotaSummary,
} from "../../hooks/useServiceQuotas";
import ResourceTable from "../../components/ResourceTable";

const fmt = (n: number | undefined) => (n === undefined || n === null ? "—" : String(n));

export function ServiceQuotasDashboard() {
  const [codeInput, setCodeInput] = useState("lambda");
  const [activeCode, setActiveCode] = useState("lambda");
  const [tab, setTab] = useState("applied");
  const { data, isLoading } = useServiceQuotas(activeCode, tab === "defaults");

  const increase = useRequestServiceQuotaIncrease();
  const [target, setTarget] = useState<ServiceQuotaSummary | null>(null);
  const [desired, setDesired] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const quotas: ServiceQuotaSummary[] = (data as any)?.quotas || [];
  const rows = quotas.map((q) => ({
    id: q.quotaCode || q.quotaName || "?",
    ...q,
  }));

  const loadCode = () => {
    const code = codeInput.trim();
    if (!code) return;
    setActiveCode(code);
    setResult(null);
  };

  const columns: any[] = [
    {
      id: "quotaName",
      header: "Quota name",
      cell: (item: any) => item.quotaName || "—",
    },
    {
      id: "quotaCode",
      header: "Quota code",
      cell: (item: any) => <Box variant="code">{item.quotaCode || "—"}</Box>,
    },
    {
      id: "value",
      header: "Value",
      cell: (item: any) => `${fmt(item.value)} ${item.unit || ""}`.trim() || "—",
    },
    {
      id: "adjustable",
      header: "Adjustable",
      cell: (item: any) => (item.adjustable ? "Yes" : "No"),
    },
  ];

  if (tab === "applied") {
    columns.push({
      id: "actions",
      header: "",
      cell: (item: any) => (
        <Button
          variant="link"
          onClick={() => {
            setTarget(item);
            setDesired("");
            setSubmitError(null);
          }}
        >
          Request increase
        </Button>
      ),
    });
  }

  const closeModal = () => {
    setTarget(null);
    setDesired("");
    setSubmitError(null);
  };

  const submitIncrease = async () => {
    const value = Number(desired);
    if (Number.isNaN(value)) {
      setSubmitError("Desired value must be a number");
      return;
    }
    try {
      const res: any = await increase.mutateAsync({
        serviceCode: activeCode,
        quotaCode: target!.quotaCode!,
        desiredValue: value,
      });
      setResult(res?.requestedQuota || null);
      closeModal();
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to request quota increase");
    }
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Service Quotas</Header>
        <SpaceBetween size="xs">
          <Box color="text-body-secondary">
            View applied and AWS default quotas for a service, and request increases against the
            Floci emulator.
          </Box>
          <SpaceBetween direction="horizontal" size="xs">
            <FormField label="Service code">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.detail.value)}
                placeholder="lambda"
                onKeyDown={(e: any) => {
                  if (e.detail.key === "Enter") loadCode();
                }}
              />
            </FormField>
            <Box padding={{ top: "xl" }}>
              <Button onClick={loadCode}>Load quotas</Button>
            </Box>
          </SpaceBetween>
        </SpaceBetween>
      </Box>

      <Tabs
        onChange={({ detail }: any) => setTab(detail.activeTabId)}
        activeTabId={tab}
        tabs={[
          { id: "applied", label: "Applied quotas" },
          { id: "defaults", label: "AWS default quotas" },
        ]}
      />

      <ResourceTable
        resourceName="Quota"
        headerTitle={`Quotas for ${activeCode}${tab === "defaults" ? " (defaults)" : ""}`}
        headerCounter={quotas.length}
        items={rows}
        columns={columns}
        loading={isLoading}
        emptyMessage={`No quotas found for service code “${activeCode}”.`}
        filterEnabled
        filterPlaceholder="Find quotas by name or code"
        filterFunction={(i: any, s: string) =>
          `${i.quotaName ?? ""} ${i.quotaCode ?? ""}`.toLowerCase().includes(s.toLowerCase())
        }
      />

      {result && (
        <Alert type="success" dismissible onDismiss={() => setResult(null)}>
          Increase requested for {result.quotaName || result.quotaCode} to{" "}
          {fmt(result.desiredValue)} — status: {result.status || "PENDING"}.
        </Alert>
      )}

      <Modal visible={!!target} onDismiss={closeModal} header="Request quota increase">
        {target && (
          <SpaceBetween size="m">
            <Box>
              {target.quotaName} ({target.quotaCode}) on <b>{activeCode}</b> — current value:{" "}
              {fmt(target.value)}
            </Box>
            <FormField label="Desired value">
              <Input
                value={desired}
                onChange={(e) => setDesired(e.detail.value)}
                placeholder="10000"
              />
            </FormField>
            {submitError && <Alert type="error">{submitError}</Alert>}
            <Button onClick={submitIncrease} disabled={!desired || increase.isPending}>
              Submit request
            </Button>
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
}
