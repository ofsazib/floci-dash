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
  FormField,
  Input,
  Alert,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useMpAgreements,
  useMpAgreementDetail,
  useMpCancelAgreement,
  useMpEntitlements,
  useMpMeterUsage,
  useMpResolveCustomer,
  useMpEntities,
  useMpEntityDetail,
  type MpAgreementSummary,
} from "../../hooks/useMarketplace";

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

function jsonLines(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function MarketplaceDashboard() {
  const agreementsQuery = useMpAgreements();
  const agreementDetail = useMpAgreementDetail();
  const cancelAgreement = useMpCancelAgreement();
  const entitlements = useMpEntitlements();
  const meterUsage = useMpMeterUsage();
  const resolveCustomer = useMpResolveCustomer();
  const entitiesQuery = useMpEntities();
  const entityDetail = useMpEntityDetail();

  const [status, setStatus] = useState<Status | null>(null);
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(null);
  const [productCode, setProductCode] = useState("");
  const [usageDimension, setUsageDimension] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("1");
  const [registrationToken, setRegistrationToken] = useState("");

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  const agreements = agreementsQuery.data?.agreements || [];
  const entities = entitiesQuery.data?.entities || [];

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "agreements",
            label: `Agreements (${agreements.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="agreement"
                  headerTitle="Agreements"
                  items={agreements}
                  loading={agreementsQuery.isLoading}
                  onRefresh={agreementsQuery.refetch}
                  columns={[
                    { id: "id", header: "Agreement ID", cell: (a: MpAgreementSummary) => a.agreementId },
                    { id: "status", header: "Status", cell: (a: MpAgreementSummary) => a.status },
                    { id: "type", header: "Type", cell: (a: MpAgreementSummary) => a.agreementType },
                    {
                      id: "actions",
                      header: "",
                      cell: (a: MpAgreementSummary) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            onClick={() =>
                              wrap(
                                async () => {
                                  const result = await agreementDetail.mutateAsync(a.agreementId!);
                                  setDetail({
                                    title: `Agreement ${a.agreementId}`,
                                    body: jsonLines(result.agreement),
                                  });
                                },
                                "Agreement details fetched."
                              )
                            }
                          >
                            Details
                          </Button>
                          <DeleteButton
                            itemName={a.agreementId!}
                            resourceType="agreement"
                            loading={cancelAgreement.isPending}
                            onDelete={() =>
                              wrap(
                                () => cancelAgreement.mutateAsync(a.agreementId!),
                                `Agreement ${a.agreementId} cancelled.`
                              )
                            }
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
              </SpaceBetween>
            ),
          },
          {
            id: "entitlements",
            label: "Entitlements",
            content: (
              <Container header={<Header variant="h3">Get entitlements</Header>}>
                <SpaceBetween size="m">
                  <SpaceBetween direction="horizontal" size="s">
                    <FormField label="Product code">
                      <Input value={productCode} onChange={({ detail }) => setProductCode(detail.value)} placeholder="prod-abc123" />
                    </FormField>
                    <Button
                      disabled={!productCode}
                      loading={entitlements.isPending}
                      onClick={() =>
                        wrap(
                          async () => {
                            const result = await entitlements.mutateAsync(productCode);
                            setDetail({ title: "Entitlements", body: jsonLines(result.entitlements) });
                          },
                          "Entitlements fetched."
                        )
                      }
                    >
                      Fetch
                    </Button>
                  </SpaceBetween>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            id: "metering",
            label: "Metering",
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h3">Meter usage</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="s">
                      <FormField label="Product code">
                        <Input value={productCode} onChange={({ detail }) => setProductCode(detail.value)} placeholder="prod-abc123" />
                      </FormField>
                      <FormField label="Usage dimension">
                        <Input value={usageDimension} onChange={({ detail }) => setUsageDimension(detail.value)} placeholder="hours" />
                      </FormField>
                      <FormField label="Quantity">
                        <Input value={usageQuantity} onChange={({ detail }) => setUsageQuantity(detail.value)} />
                      </FormField>
                      <Button
                        disabled={!productCode || !usageDimension}
                        loading={meterUsage.isPending}
                        onClick={() =>
                          wrap(
                            async () => {
                              const result = await meterUsage.mutateAsync({
                                productCode,
                                usageDimension,
                                usageQuantity: Number(usageQuantity) || 1,
                              });
                              setDetail({ title: "Metering record", body: jsonLines(result) });
                            },
                            "Usage metered."
                          )
                        }
                      >
                        Submit
                      </Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Container>
                <Container header={<Header variant="h3">Resolve customer</Header>}>
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="s">
                      <FormField label="Registration token">
                        <Input value={registrationToken} onChange={({ detail }) => setRegistrationToken(detail.value)} placeholder="token" />
                      </FormField>
                      <Button
                        disabled={!registrationToken}
                        loading={resolveCustomer.isPending}
                        onClick={() =>
                          wrap(
                            async () => {
                              const result = await resolveCustomer.mutateAsync(registrationToken);
                              setDetail({ title: "Resolved customer", body: jsonLines(result) });
                            },
                            "Customer resolved."
                          )
                        }
                      >
                        Resolve
                      </Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "catalog",
            label: `Catalog (${entities.length})`,
            content: (
              <ResourceTable
                resourceName="entity"
                headerTitle="Catalog entities"
                items={entities}
                loading={entitiesQuery.isLoading}
                onRefresh={entitiesQuery.refetch}
                columns={[
                  {
                    id: "id",
                    header: "Entity ID",
                    cell: (e: Record<string, unknown>) => String(e.EntityId ?? ""),
                  },
                  {
                    id: "type",
                    header: "Type",
                    cell: (e: Record<string, unknown>) => String(e.EntityType ?? ""),
                  },
                  {
                    id: "arn",
                    header: "ARN",
                    cell: (e: Record<string, unknown>) => String(e.EntityArn ?? ""),
                  },
                  {
                    id: "actions",
                    header: "",
                    cell: (e: Record<string, unknown>) => (
                      <Button
                        onClick={() =>
                          wrap(
                            async () => {
                              const result = await entityDetail.mutateAsync(String(e.EntityId));
                              setDetail({
                                title: `Entity ${String(e.EntityId)}`,
                                body: jsonLines(result.entity),
                              });
                            },
                            "Entity details fetched."
                          )
                        }
                      >
                        Details
                      </Button>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <Modal
        visible={detail !== null}
        onDismiss={() => setDetail(null)}
        header={detail?.title || ""}
        size="large"
      >
        <Box>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{detail?.body}</pre>
        </Box>
      </Modal>
    </SpaceBetween>
  );
}
