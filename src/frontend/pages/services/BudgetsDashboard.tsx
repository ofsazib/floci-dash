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
  Select,
  Alert,
  ColumnLayout,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useBudgetNotifications,
  useCreateBudgetNotification,
  useDeleteBudgetNotification,
  useBudgetSubscribers,
  useCreateBudgetSubscriber,
  useDeleteBudgetSubscriber,
  useBudgetActions,
  useCreateBudgetAction,
  useDeleteBudgetAction,
  useExecuteBudgetAction,
  type Budget,
  type BudgetNotification,
  type BudgetAction,
} from "../../hooks/useBudgets";

const BUDGET_TYPES = ["COST", "USAGE", "RI_UTILIZATION", "RI_COVERAGE", "SAVINGS_PLANS_UTILIZATION", "SAVINGS_PLANS_COVERAGE"];
const TIME_UNITS = ["DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY"];
const NOTIFICATION_TYPES = ["ACTUAL", "FORECASTED"];
const COMPARISONS = ["GREATER_THAN", "LESS_THAN", "EQUAL_TO"];

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

function CreateBudgetModal({
  visible,
  loading,
  onDismiss,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  onDismiss: () => void;
  onSubmit: (budget: Budget) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("COST");
  const [timeUnit, setTimeUnit] = useState("MONTHLY");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("USD");

  const submit = () => {
    const budget: Budget = {
      BudgetName: name,
      BudgetType: type,
      TimeUnit: timeUnit,
    };
    if (amount) {
      budget.BudgetLimit = { Amount: amount, Unit: unit };
    }
    onSubmit(budget);
    setName("");
    setAmount("");
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} header="Create budget">
      <Form>
        <SpaceBetween size="m">
          <FormField label="Budget name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="monthly-spend" />
          </FormField>
          <FormField label="Budget type">
            <Select
              selectedOption={{ value: type, label: type }}
              options={BUDGET_TYPES.map((t) => ({ value: t, label: t }))}
              onChange={({ detail }) => setType(detail.selectedOption.value!)}
            />
          </FormField>
          <FormField label="Time unit">
            <Select
              selectedOption={{ value: timeUnit, label: timeUnit }}
              options={TIME_UNITS.map((t) => ({ value: t, label: t }))}
              onChange={({ detail }) => setTimeUnit(detail.selectedOption.value!)}
            />
          </FormField>
          <FormField label="Limit amount (optional)">
            <Input value={amount} onChange={({ detail }) => setAmount(detail.value)} placeholder="100" />
          </FormField>
          <FormField label="Limit unit">
            <Input value={unit} onChange={({ detail }) => setUnit(detail.value)} />
          </FormField>
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={onDismiss}>Cancel</Button>
              <Button variant="primary" disabled={!name} loading={loading} onClick={submit}>Create</Button>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}

function BudgetDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const notificationsQuery = useBudgetNotifications(name);
  const createNotification = useCreateBudgetNotification();
  const deleteNotification = useDeleteBudgetNotification();
  const [selectedNotification, setSelectedNotification] = useState<BudgetNotification | null>(null);
  const subscribersQuery = useBudgetSubscribers(name, selectedNotification);
  const createSubscriber = useCreateBudgetSubscriber();
  const deleteSubscriber = useDeleteBudgetSubscriber();
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const actionsQuery = useBudgetActions(name);
  const createAction = useCreateBudgetAction();
  const deleteAction = useDeleteBudgetAction();
  const executeAction = useExecuteBudgetAction();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [notifType, setNotifType] = useState("ACTUAL");
  const [comparison, setComparison] = useState("GREATER_THAN");
  const [threshold, setThreshold] = useState("80");
  const [notifEmail, setNotifEmail] = useState("");
  const [actionType, setActionType] = useState("APPLY_IAM_POLICY");
  const [policyArn, setPolicyArn] = useState("");
  const [roleArn, setRoleArn] = useState("");

  async function handleCreateNotification() {
    setStatus(null);
    try {
      await createNotification.mutateAsync({
        budgetName: name,
        notification: {
          NotificationType: notifType,
          ComparisonOperator: comparison,
          Threshold: Number(threshold),
          ThresholdType: "PERCENTAGE",
        },
        subscribers: [{ SubscriptionType: "EMAIL", Address: notifEmail }],
      });
      setShowNotificationModal(false);
      setNotifEmail("");
      setStatus({ type: "success", message: "Notification created." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create notification" });
    }
  }

  async function handleCreateAction() {
    setStatus(null);
    try {
      await createAction.mutateAsync({
        budgetName: name,
        actionType,
        notificationType: "ACTUAL",
        actionThreshold: { ActionThresholdValue: Number(threshold), ActionThresholdType: "PERCENTAGE" },
        definition: { IamActionDefinition: { PolicyArn: policyArn } },
        executionRoleArn: roleArn,
        approvalModel: "AUTOMATIC",
        subscribers: [{ SubscriptionType: "EMAIL", Address: notifEmail }],
      });
      setShowActionModal(false);
      setPolicyArn("");
      setRoleArn("");
      setStatus({ type: "success", message: "Action created." });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create action" });
    }
  }

  const notifications = notificationsQuery.data?.notifications || [];
  const subscribers = subscribersQuery.data?.subscribers || [];
  const actions = actionsQuery.data?.actions || [];

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>
        Back to budgets
      </Button>
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <Container header={<Header variant="h2">{name}</Header>}>
                <ColumnLayout columns={2} variant="text-grid">
                  <SpaceBetween size="xs">
                    <Box variant="awsui-key-label">Budget</Box>
                    <Box>{name}</Box>
                  </SpaceBetween>
                </ColumnLayout>
              </Container>
            ),
          },
          {
            id: "notifications",
            label: `Notifications (${notifications.length})`,
            content: (
              <SpaceBetween size="m">
                <ResourceTable
                  resourceName="notification"
                  headerTitle="Notifications"
                  items={notifications}
                  loading={notificationsQuery.isLoading}
                  onCreate={() => setShowNotificationModal(true)}
                  onRefresh={notificationsQuery.refetch}
                  columns={[
                    { id: "type", header: "Type", cell: (n: BudgetNotification) => n.NotificationType ?? "—" },
                    { id: "comparison", header: "Comparison", cell: (n: BudgetNotification) => n.ComparisonOperator ?? "—" },
                    { id: "threshold", header: "Threshold", cell: (n: BudgetNotification) => `${n.Threshold ?? "—"}%` },
                    {
                      id: "actions",
                      header: "",
                      cell: (n: BudgetNotification) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => setSelectedNotification(n)}>Subscribers</Button>
                          <DeleteButton
                            itemName={`${n.NotificationType} ${n.ComparisonOperator}`}
                            resourceType="notification"
                            loading={deleteNotification.isPending}
                            onDelete={() =>
                              deleteNotification.mutateAsync({ budgetName: name, notification: n })
                            }
                          />
                        </SpaceBetween>
                      ),
                    },
                  ]}
                />
                {selectedNotification && (
                  <Container
                    header={
                      <Header
                        variant="h3"
                        actions={<Button onClick={() => setSelectedNotification(null)}>Close</Button>}
                      >
                        Subscribers
                      </Header>
                    }
                  >
                    <SpaceBetween size="m">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Input
                          value={subscriberEmail}
                          onChange={({ detail }) => setSubscriberEmail(detail.value)}
                          placeholder="add-subscriber@example.com"
                        />
                        <Button
                          variant="primary"
                          disabled={!subscriberEmail}
                          loading={createSubscriber.isPending}
                          onClick={() => {
                            createSubscriber
                              .mutateAsync({
                                budgetName: name,
                                notification: selectedNotification,
                                subscriber: { SubscriptionType: "EMAIL", Address: subscriberEmail },
                              })
                              .then(() => setSubscriberEmail(""));
                          }}
                        >
                          Add subscriber
                        </Button>
                      </SpaceBetween>
                      <ResourceTable
                        resourceName="subscriber"
                        headerTitle="Subscribers"
                        items={subscribers}
                        loading={subscribersQuery.isLoading}
                        columns={[
                          { id: "type", header: "Type", cell: (s: any) => s.SubscriptionType },
                          { id: "address", header: "Address", cell: (s: any) => s.Address },
                          {
                            id: "actions",
                            header: "",
                            cell: (s: any) => (
                              <DeleteButton
                                itemName={s.Address}
                                resourceType="subscriber"
                                loading={deleteSubscriber.isPending}
                                onDelete={() =>
                                  deleteSubscriber.mutateAsync({
                                    budgetName: name,
                                    notification: selectedNotification,
                                    subscriber: s,
                                  })
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
          {
            id: "actions",
            label: `Actions (${actions.length})`,
            content: (
              <ResourceTable
                resourceName="action"
                headerTitle="Actions"
                items={actions}
                loading={actionsQuery.isLoading}
                onCreate={() => setShowActionModal(true)}
                onRefresh={actionsQuery.refetch}
                columns={[
                  { id: "id", header: "Action ID", cell: (a: BudgetAction) => a.ActionId },
                  { id: "type", header: "Type", cell: (a: BudgetAction) => a.ActionType },
                  { id: "status", header: "Status", cell: (a: BudgetAction) => a.Status },
                  { id: "threshold", header: "Threshold", cell: (a: BudgetAction) => `${a.ActionThreshold?.ActionThresholdValue ?? "—"}%` },
                  {
                    id: "actions",
                    header: "",
                    cell: (a: BudgetAction) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          loading={executeAction.isPending}
                          onClick={() =>
                            executeAction.mutateAsync({
                              budgetName: name,
                              actionId: a.ActionId!,
                              executionType: "APPROVE_BUDGET_ACTION",
                            })
                          }
                        >
                          Approve
                        </Button>
                        <DeleteButton
                          itemName={a.ActionId!}
                          resourceType="action"
                          loading={deleteAction.isPending}
                          onDelete={() =>
                            deleteAction.mutateAsync({ budgetName: name, actionId: a.ActionId! })
                          }
                        />
                      </SpaceBetween>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
      <Modal
        visible={showNotificationModal}
        onDismiss={() => setShowNotificationModal(false)}
        header="Create notification"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Notification type">
              <Select
                selectedOption={{ value: notifType, label: notifType }}
                options={NOTIFICATION_TYPES.map((t) => ({ value: t, label: t }))}
                onChange={({ detail }) => setNotifType(detail.selectedOption.value!)}
              />
            </FormField>
            <FormField label="Comparison">
              <Select
                selectedOption={{ value: comparison, label: comparison }}
                options={COMPARISONS.map((t) => ({ value: t, label: t }))}
                onChange={({ detail }) => setComparison(detail.selectedOption.value!)}
              />
            </FormField>
            <FormField label="Threshold (%)">
              <Input value={threshold} onChange={({ detail }) => setThreshold(detail.value)} />
            </FormField>
            <FormField label="Subscriber email">
              <Input value={notifEmail} onChange={({ detail }) => setNotifEmail(detail.value)} placeholder="owner@example.com" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowNotificationModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!notifEmail}
                  loading={createNotification.isPending}
                  onClick={handleCreateNotification}
                >
                  Create
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal
        visible={showActionModal}
        onDismiss={() => setShowActionModal(false)}
        header="Create action"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="Action type">
              <Select
                selectedOption={{ value: actionType, label: actionType }}
                options={[{ value: "APPLY_IAM_POLICY", label: "APPLY_IAM_POLICY" }]}
                onChange={({ detail }) => setActionType(detail.selectedOption.value!)}
              />
            </FormField>
            <FormField label="IAM policy ARN">
              <Input value={policyArn} onChange={({ detail }) => setPolicyArn(detail.value)} placeholder="arn:aws:iam::aws:policy/..." />
            </FormField>
            <FormField label="Execution role ARN">
              <Input value={roleArn} onChange={({ detail }) => setRoleArn(detail.value)} placeholder="arn:aws:iam::aws:role/..." />
            </FormField>
            <FormField label="Subscriber email">
              <Input value={notifEmail} onChange={({ detail }) => setNotifEmail(detail.value)} placeholder="owner@example.com" />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowActionModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!policyArn || !roleArn || !notifEmail}
                  loading={createAction.isPending}
                  onClick={handleCreateAction}
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

export default function BudgetsDashboard() {
  const { data, isLoading, isError, error, refetch } = useBudgets();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleCreate(budget: Budget) {
    setStatus(null);
    try {
      await createBudget.mutateAsync(budget);
      setShowCreate(false);
      setStatus({ type: "success", message: `Budget ${budget.BudgetName} created.` });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to create budget" });
    }
  }

  if (selected) {
    return <BudgetDetail name={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <ResourceTable
        resourceName="budget"
        headerTitle="Budgets"
        items={data?.budgets || []}
        loading={isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={refetch}
        columns={[
          { id: "name", header: "Name", cell: (b: Budget) => b.BudgetName },
          { id: "type", header: "Type", cell: (b: Budget) => b.BudgetType },
          { id: "timeUnit", header: "Period", cell: (b: Budget) => b.TimeUnit },
          { id: "limit", header: "Limit", cell: (b: Budget) => (b.BudgetLimit ? `${b.BudgetLimit.Amount} ${b.BudgetLimit.Unit}` : "—") },
          { id: "spend", header: "Actual spend", cell: (b: Budget) => (b.CalculatedSpend?.ActualSpend ? `${b.CalculatedSpend.ActualSpend.Amount} ${b.CalculatedSpend.ActualSpend.Unit}` : "—") },
          {
            id: "actions",
            header: "",
            cell: (b: Budget) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelected(b.BudgetName!)}>View</Button>
                <DeleteButton
                  itemName={b.BudgetName!}
                  resourceType="budget"
                  loading={deleteBudget.isPending}
                  onDelete={() => deleteBudget.mutateAsync(b.BudgetName!)}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {isError && (
        <Alert type="error">{(error as Error)?.message || "Failed to load budgets"}</Alert>
      )}
      <CreateBudgetModal
        visible={showCreate}
        loading={createBudget.isPending}
        onDismiss={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </SpaceBetween>
  );
}
