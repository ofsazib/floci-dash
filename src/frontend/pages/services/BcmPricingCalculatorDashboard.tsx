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
  Alert,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useBcmCreateEstimate,
  useBcmGetEstimate,
  useBcmDeleteEstimate,
  useBcmCreateUsage,
  type BcmEstimate,
  type BcmUsageError,
} from "../../hooks/useBcmPricingCalculator";

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

export default function BcmPricingCalculatorDashboard() {
  const createEstimate = useBcmCreateEstimate();
  const getEstimate = useBcmGetEstimate();
  const deleteEstimate = useBcmDeleteEstimate();
  const createUsage = useBcmCreateUsage();

  // Floci exposes no ListWorkloadEstimates, so the dashboard tracks the
  // estimates created (or opened) during this session.
  const [estimates, setEstimates] = useState<BcmEstimate[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [usageErrors, setUsageErrors] = useState<BcmUsageError[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [estimateName, setEstimateName] = useState("");
  const [rateType, setRateType] = useState("BEFORE_DISCOUNTS");
  const [showOpen, setShowOpen] = useState(false);
  const [openId, setOpenId] = useState("");
  const [usageEstimateId, setUsageEstimateId] = useState("");
  const [usageServiceCode, setUsageServiceCode] = useState("");
  const [usageType, setUsageType] = useState("");
  const [usageOperation, setUsageOperation] = useState("");
  const [usageAmount, setUsageAmount] = useState("1");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  function rememberEstimate(estimate: BcmEstimate) {
    setEstimates((prev) =>
      prev.some((e) => e.id === estimate.id) ? prev : [...prev, estimate]
    );
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="workload estimate"
        headerTitle="Workload estimates"
        items={estimates}
        onCreate={() => setShowCreate(true)}
        onRefresh={() => wrap(async () => {}, "Session list refreshed.")}
        columns={[
          { id: "name", header: "Name", cell: (e: BcmEstimate) => e.name },
          { id: "id", header: "Estimate ID", cell: (e: BcmEstimate) => e.id },
          { id: "status", header: "Status", cell: (e: BcmEstimate) => e.status },
          { id: "rate", header: "Rate type", cell: (e: BcmEstimate) => e.rateType },
          {
            id: "cost",
            header: "Total cost",
            cell: (e: BcmEstimate) => `${e.totalCost} ${e.costCurrency ?? ""}`,
          },
          {
            id: "actions",
            header: "",
            cell: (e: BcmEstimate) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => {
                    setUsageEstimateId(e.id!);
                    setStatus({ type: "success", message: `Usage target set to ${e.id}.` });
                  }}
                >
                  Set as usage target
                </Button>
                <DeleteButton
                  itemName={e.id!}
                  resourceType="estimate"
                  loading={deleteEstimate.isPending}
                  onDelete={() =>
                    wrap(
                      async () => {
                        await deleteEstimate.mutateAsync(e.id!);
                        setEstimates((prev) => prev.filter((x) => x.id !== e.id));
                      },
                      `Estimate ${e.name} deleted.`
                    )
                  }
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <SpaceBetween direction="horizontal" size="s">
        <Button onClick={() => setShowOpen(true)}>Open by ID</Button>
      </SpaceBetween>
      <Container header={<Header variant="h3">Add usage to estimate</Header>}>
        <SpaceBetween size="m">
          <Box>Target estimate: {usageEstimateId || "none selected"}</Box>
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Service code">
              <Input value={usageServiceCode} onChange={({ detail }) => setUsageServiceCode(detail.value)} placeholder="AmazonEC2" />
            </FormField>
            <FormField label="Usage type">
              <Input value={usageType} onChange={({ detail }) => setUsageType(detail.value)} placeholder="BoxUsage:t3.micro" />
            </FormField>
            <FormField label="Operation">
              <Input value={usageOperation} onChange={({ detail }) => setUsageOperation(detail.value)} placeholder="RunInstances" />
            </FormField>
            <FormField label="Amount">
              <Input value={usageAmount} onChange={({ detail }) => setUsageAmount(detail.value)} />
            </FormField>
            <Button
              disabled={!usageEstimateId || !usageServiceCode || !usageType || !usageOperation}
              loading={createUsage.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await createUsage.mutateAsync({
                      workloadEstimateId: usageEstimateId,
                      usage: [
                        {
                          serviceCode: usageServiceCode,
                          usageType,
                          operation: usageOperation,
                          usageAccountId: "000000000000",
                          amount: Number(usageAmount) || 1,
                        },
                      ],
                    });
                    setUsageErrors(result.errors || []);
                  },
                  "Usage batch submitted."
                )
              }
            >
              Add usage
            </Button>
          </SpaceBetween>
          {usageErrors.length > 0 && (
            <Alert type="warning">
              {usageErrors
                .map((e) => `${e.key ?? "entry"}: ${e.errorCode} — ${e.errorMessage}`)
                .join("; ")}
            </Alert>
          )}
        </SpaceBetween>
      </Container>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create workload estimate"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Estimate name">
              <Input value={estimateName} onChange={({ detail }) => setEstimateName(detail.value)} />
            </FormField>
            <FormField label="Rate type">
              <Input value={rateType} onChange={({ detail }) => setRateType(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!estimateName}
                  loading={createEstimate.isPending}
                  onClick={() =>
                    wrap(
                      async () => {
                        const result = await createEstimate.mutateAsync({
                          name: estimateName,
                          rateType,
                        });
                        rememberEstimate(result.estimate);
                      },
                      `Estimate ${estimateName} created.`
                    ).then(() => {
                      setShowCreate(false);
                      setEstimateName("");
                    })
                  }
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal visible={showOpen} onDismiss={() => setShowOpen(false)} header="Open estimate by ID">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Estimate ID">
              <Input value={openId} onChange={({ detail }) => setOpenId(detail.value)} />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowOpen(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!openId}
                  loading={getEstimate.isPending}
                  onClick={() =>
                    wrap(
                      async () => {
                        const result = await getEstimate.mutateAsync(openId);
                        rememberEstimate(result.estimate);
                      },
                      `Estimate ${openId} opened.`
                    ).then(() => {
                      setShowOpen(false);
                      setOpenId("");
                    })
                  }
                >
                  Open
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
