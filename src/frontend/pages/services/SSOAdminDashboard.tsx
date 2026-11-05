import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  Modal,
  SpaceBetween,
  StatusIndicator,
  Textarea,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useSSOInstances,
  usePermissionSets,
  usePermissionSetDetail,
  useCreatePermissionSet,
  useUpdatePermissionSet,
  useDeletePermissionSet,
  useManagedPolicies,
  useAttachManagedPolicy,
  useDetachManagedPolicy,
  useCustomerManagedPolicyReferences,
  useAttachCustomerManagedPolicy,
  useDetachCustomerManagedPolicy,
  useInlinePolicy,
  usePutInlinePolicy,
  useDeleteInlinePolicy,
  usePermissionsBoundary,
  usePutPermissionsBoundary,
  useDeletePermissionsBoundary,
  useSsoTags,
  useAddSsoTags,
  useRemoveSsoTags,
  useAccountAssignments,
  useCreateAccountAssignment,
  useDeleteAccountAssignment,
  useAssignmentCreationStatuses,
  useAssignmentDeletionStatuses,
  usePermissionSetProvisioningStatuses,
  useProvisionPermissionSet,
  useAccountsForProvisionedPermissionSet,
  useTrustedTokenIssuers,
  useTrustedTokenIssuerDetail,
  useCreateTrustedTokenIssuer,
  useUpdateTrustedTokenIssuer,
  useDeleteTrustedTokenIssuer,
  useAccessControlAttributeConfiguration,
  useCreateAccessControlConfig,
  useUpdateAccessControlConfig,
  useDeleteAccessControlConfig,
  useSsoRegions,
  useAddSsoRegion,
  useRemoveSsoRegion,
  type SSOInstance,
  type SsoPermissionSet,
} from "../../hooks/useSSOAdmin";

interface Status {
  type: "success" | "error";
  message: string;
}

interface TabProps {
  instanceArn: string;
  onStatus: (status: Status | null) => void;
}

function errMsg(err: unknown, fallback: string) {
  return (err as any)?.message || fallback;
}

function StatusAlert({ status, onDismiss }: { status: Status | null; onDismiss: () => void }) {
  if (!status) return null;
  return (
    <Alert type={status.type} dismissible onDismiss={onDismiss}>
      {status.message}
    </Alert>
  );
}

export function SSOAdminDashboard() {
  const { data, isLoading } = useSSOInstances();
  const instances: SSOInstance[] = data?.instances || [];
  const [instanceArn, setInstanceArn] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!instanceArn && instances.length > 0) setInstanceArn(instances[0].InstanceArn);
  }, [instanceArn, instances]);

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">IAM Identity Center (SSO Admin)</Header>
        <Box color="text-body-secondary">
          Manage the Floci Identity Center instance: permission sets, account assignments,
          trusted token issuers, access control attributes and regions.
        </Box>
      </Box>
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      {isLoading ? <Box>Loading instances...</Box> : (
        <>
          <ResourceTable
            resourceName="Instance"
            headerTitle="Identity Center instances"
            headerCounter={data?.total}
            items={instances.map((i) => ({
              id: i.InstanceArn,
              arn: i.InstanceArn,
              identityStoreId: i.IdentityStoreId,
              name: i.Name,
              ownerAccountId: i.OwnerAccountId,
              status: i.Status,
            }))}
            emptyMessage="No Identity Center instances"
            columns={[
              { id: "name", header: "Name", cell: (i: any) => i.name || "—", isRowHeader: true },
              {
                id: "arn",
                header: "Instance ARN",
                cell: (i: any) => <Box variant="code">{i.arn}</Box>,
              },
              {
                id: "identityStoreId",
                header: "Identity store ID",
                cell: (i: any) => <Box variant="code">{i.identityStoreId || "—"}</Box>,
              },
              { id: "ownerAccountId", header: "Owner account", cell: (i: any) => i.ownerAccountId || "—" },
              { id: "status", header: "Status", cell: (i: any) => i.status || "—" },
            ]}
            filterEnabled
            filterPlaceholder="Find instances by name or ARN"
            filterFunction={(i: any, s: string) =>
              `${i.name ?? ""} ${i.arn}`.toLowerCase().includes(s.toLowerCase())
            }
          />
          {!instanceArn ? (
            <Alert type="info">
              No Identity Center instance found in Floci. Start Floci to provision the seeded
              organization instance.
            </Alert>
          ) : (
            <ServiceDashboardLayout
          tabs={[
            {
              id: "permission-sets",
              label: "Permission Sets",
              content: <PermissionSetsTab instanceArn={instanceArn} onStatus={setStatus} />,
            },
            {
              id: "assignments",
              label: "Account Assignments",
              content: <AccountAssignmentsTab instanceArn={instanceArn} onStatus={setStatus} />,
            },
            {
              id: "ttis",
              label: "Trusted Token Issuers",
              content: <TrustedTokenIssuersTab instanceArn={instanceArn} onStatus={setStatus} />,
            },
            {
              id: "attributes",
              label: "Access Control Attributes",
              content: <AccessControlAttributesTab instanceArn={instanceArn} onStatus={setStatus} />,
            },
            {
              id: "regions",
              label: "Regions",
              content: <RegionsTab instanceArn={instanceArn} onStatus={setStatus} />,
            },
          ]}
        />
          )}
        </>
      )}
    </SpaceBetween>
  );
}

// ── Permission Sets ──────────────────────────────────────

function PermissionSetsTab({ instanceArn, onStatus }: TabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDuration, setSessionDuration] = useState("PT1H");
  const [managedArn, setManagedArn] = useState<string | null>(null);
  const closeCreatePs = () => setShowCreate(false);

  const list = usePermissionSets(instanceArn);
  const createPs = useCreatePermissionSet();
  const deletePs = useDeletePermissionSet();

  const permissionSets: SsoPermissionSet[] = list.data?.permissionSets || [];

  async function handleCreate() {
    try {
      await createPs.mutateAsync({
        instanceArn,
        name,
        description: description || undefined,
        sessionDuration: sessionDuration || undefined,
      });
      setShowCreate(false);
      setName("");
      setDescription("");
      setSessionDuration("PT1H");
      onStatus({ type: "success", message: `Permission set ${name} created.` });
    } catch (err) {
      onStatus({ type: "error", message: errMsg(err, "Failed to create permission set") });
    }
  }

  return (
    <SpaceBetween size="m">
      <ResourceTable
        resourceName="permission set"
        headerTitle="Permission sets"
        items={permissionSets}
        loading={list.isLoading}
        onCreate={() => setShowCreate(true)}
        onRefresh={list.refetch}
        emptyMessage="No permission sets"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (p: SsoPermissionSet) => p.Name || "—",
            isRowHeader: true,
          },
          {
            id: "arn",
            header: "ARN",
            cell: (p: SsoPermissionSet) => <Box variant="code">{p.PermissionSetArn}</Box>,
          },
          {
            id: "description",
            header: "Description",
            cell: (p: SsoPermissionSet) => p.Description || "—",
          },
          {
            id: "session",
            header: "Session duration",
            cell: (p: SsoPermissionSet) => p.SessionDuration || "—",
          },
          {
            id: "actions",
            header: "",
            cell: (p: SsoPermissionSet) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setManagedArn(p.PermissionSetArn)}>Manage</Button>
                <DeleteButton
                  itemName={p.Name || p.PermissionSetArn}
                  resourceType="permission set"
                  loading={deletePs.isPending}
                  onDelete={async () => {
                    try {
                      await deletePs.mutateAsync({
                        instanceArn,
                        permissionSetArn: p.PermissionSetArn,
                      });
                      if (managedArn === p.PermissionSetArn) setManagedArn(null);
                    } catch (err) {
                      onStatus({
                        type: "error",
                        message: errMsg(err, "Failed to delete permission set"),
                      });
                    }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      {managedArn && (
        <PermissionSetDetail
          instanceArn={instanceArn}
          permissionSetArn={managedArn}
          onStatus={onStatus}
          onClose={() => setManagedArn(null)}
        />
      )}
      <Modal visible={showCreate} onDismiss={closeCreatePs} header="Create permission set">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={name}
                onChange={({ detail }) => setName(detail.value)}
                placeholder="Permission set name"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={description}
                onChange={({ detail }) => setDescription(detail.value)}
                placeholder="Description"
              />
            </FormField>
            <FormField label="Session duration (ISO-8601, 1h-12h)">
              <Input
                value={sessionDuration}
                onChange={({ detail }) => setSessionDuration(detail.value)}
                placeholder="PT1H"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeCreatePs}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!name}
                  loading={createPs.isPending}
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

function PermissionSetDetail({
  instanceArn,
  permissionSetArn,
  onStatus,
  onClose,
}: TabProps & { permissionSetArn: string; onClose: () => void }) {
  const detail = usePermissionSetDetail(instanceArn, permissionSetArn);
  const updatePs = useUpdatePermissionSet();

  const [description, setDescription] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [policyArn, setPolicyArn] = useState("");
  const [custName, setCustName] = useState("");
  const [custPath, setCustPath] = useState("");
  const [inlineText, setInlineText] = useState("");
  const [boundaryArn, setBoundaryArn] = useState("");
  const [boundaryName, setBoundaryName] = useState("");
  const [boundaryPath, setBoundaryPath] = useState("");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [provisionTarget, setProvisionTarget] = useState("");

  const managed = useManagedPolicies(instanceArn, permissionSetArn);
  const attachPolicy = useAttachManagedPolicy();
  const detachPolicy = useDetachManagedPolicy();
  const custRefs = useCustomerManagedPolicyReferences(instanceArn, permissionSetArn);
  const attachCust = useAttachCustomerManagedPolicy();
  const detachCust = useDetachCustomerManagedPolicy();
  const inline = useInlinePolicy(instanceArn, permissionSetArn);
  const putInline = usePutInlinePolicy();
  const delInline = useDeleteInlinePolicy();
  const boundary = usePermissionsBoundary(instanceArn, permissionSetArn);
  const putBoundary = usePutPermissionsBoundary();
  const delBoundary = useDeletePermissionsBoundary();
  const tags = useSsoTags(permissionSetArn);
  const addTags = useAddSsoTags();
  const removeTags = useRemoveSsoTags();
  const provisioning = usePermissionSetProvisioningStatuses(instanceArn);
  const provision = useProvisionPermissionSet();
  const provisionedAccounts = useAccountsForProvisionedPermissionSet(instanceArn, permissionSetArn);

  useEffect(() => {
    setDescription(detail.data?.permissionSet?.Description || "");
    setSessionDuration(detail.data?.permissionSet?.SessionDuration || "");
  }, [detail.data]);

  useEffect(() => {
    setInlineText(inline.data?.inlinePolicy || "");
  }, [inline.data]);

  const currentBoundary = boundary.data?.permissionsBoundary;

  async function run(action: string, fn: () => Promise<unknown>, success?: string) {
    try {
      await fn();
      if (success) onStatus({ type: "success", message: success });
    } catch (err) {
      onStatus({ type: "error", message: errMsg(err, `Failed to ${action}`) });
    }
  }

  return (
    <Container
      header={
        <Header
          variant="h3"
          actions={<Button onClick={onClose}>Close</Button>}
        >
          Manage {detail.data?.permissionSet?.Name || permissionSetArn}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <FormField label="Description">
          <Input
            value={description}
            onChange={({ detail }) => setDescription(detail.value)}
            placeholder="Description"
          />
        </FormField>
        <FormField label="Session duration (ISO-8601)">
          <Input
            value={sessionDuration}
            onChange={({ detail }) => setSessionDuration(detail.value)}
            placeholder="PT1H"
          />
        </FormField>
        <Box float="left">
          <Button
            loading={updatePs.isPending}
            onClick={() =>
              run(
                "update permission set",
                () =>
                  updatePs.mutateAsync({
                    instanceArn,
                    permissionSetArn,
                    description: description || undefined,
                    sessionDuration: sessionDuration || undefined,
                  }),
                "Permission set updated."
              )
            }
          >
            Save details
          </Button>
        </Box>

        <ResourceTable
          resourceName="managed policy"
          headerTitle="Attached managed policies"
          items={managed.data?.policies || []}
          loading={managed.isLoading}
          emptyMessage="No managed policies attached"
          columns={[
            { id: "name", header: "Name", cell: (p: any) => p.Name || p.Arn, isRowHeader: true },
            { id: "arn", header: "ARN", cell: (p: any) => <Box variant="code">{p.Arn}</Box> },
            {
              id: "actions",
              header: "",
              cell: (p: any) => (
                <DeleteButton
                  itemName={p.Name || p.Arn}
                  resourceType="managed policy"
                  loading={detachPolicy.isPending}
                  onDelete={() =>
                    run("detach managed policy", () =>
                      detachPolicy.mutateAsync({
                        instanceArn,
                        permissionSetArn,
                        managedPolicyArn: p.Arn,
                      })
                    )
                  }
                />
              ),
            },
          ]}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={policyArn}
            onChange={({ detail }) => setPolicyArn(detail.value)}
            placeholder="Managed policy ARN"
          />
          <Button
            variant="primary"
            disabled={!policyArn}
            loading={attachPolicy.isPending}
            onClick={() =>
              run(
                "attach managed policy",
                () =>
                  attachPolicy.mutateAsync({
                    instanceArn,
                    permissionSetArn,
                    managedPolicyArn: policyArn,
                  }),
                "Managed policy attached."
              ).then(() => setPolicyArn(""))
            }
          >
            Attach policy
          </Button>
        </SpaceBetween>

        <ResourceTable
          resourceName="customer managed policy reference"
          headerTitle="Customer managed policy references"
          items={custRefs.data?.references || []}
          loading={custRefs.isLoading}
          emptyMessage="No customer managed policy references"
          columns={[
            { id: "name", header: "Name", cell: (r: any) => r.Name, isRowHeader: true },
            { id: "path", header: "Path", cell: (r: any) => r.Path || "/" },
            {
              id: "actions",
              header: "",
              cell: (r: any) => (
                <DeleteButton
                  itemName={r.Name}
                  resourceType="policy reference"
                  loading={detachCust.isPending}
                  onDelete={() =>
                    run("detach policy reference", () =>
                      detachCust.mutateAsync({
                        instanceArn,
                        permissionSetArn,
                        name: r.Name,
                        path: r.Path,
                      })
                    )
                  }
                />
              ),
            },
          ]}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={custName}
            onChange={({ detail }) => setCustName(detail.value)}
            placeholder="Reference name"
          />
          <Input
            value={custPath}
            onChange={({ detail }) => setCustPath(detail.value)}
            placeholder="Reference path"
          />
          <Button
            variant="primary"
            disabled={!custName}
            loading={attachCust.isPending}
            onClick={() =>
              run(
                "attach policy reference",
                () =>
                  attachCust.mutateAsync({
                    instanceArn,
                    permissionSetArn,
                    name: custName,
                    path: custPath || undefined,
                  }),
                "Policy reference attached."
              ).then(() => {
                setCustName("");
                setCustPath("");
              })
            }
          >
            Attach reference
          </Button>
        </SpaceBetween>

        <FormField label="Inline policy (JSON)">
          <Textarea
            value={inlineText}
            onChange={({ detail }) => setInlineText(detail.value)}
            rows={6}
            placeholder="Inline policy JSON"
          />
        </FormField>
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="primary"
            disabled={!inlineText}
            loading={putInline.isPending}
            onClick={() =>
              run(
                "save inline policy",
                () => putInline.mutateAsync({ instanceArn, permissionSetArn, inlinePolicy: inlineText }),
                "Inline policy saved."
              )
            }
          >
            Save policy
          </Button>
          <Button
            loading={delInline.isPending}
            onClick={() =>
              run(
                "delete inline policy",
                () => delInline.mutateAsync({ instanceArn, permissionSetArn }),
                "Inline policy deleted."
              )
            }
          >
            Delete policy
          </Button>
        </SpaceBetween>

        <Container header={<Header variant="h3">Permissions boundary</Header>}>
          <SpaceBetween size="m">
            {currentBoundary ? (
              currentBoundary.ManagedPolicyArn ? (
                <Box variant="code">{currentBoundary.ManagedPolicyArn}</Box>
              ) : (
                <Box variant="code">
                  {currentBoundary.CustomerManagedPolicyReference?.Name}{" "}
                  {currentBoundary.CustomerManagedPolicyReference?.Path || "/"}
                </Box>
              )
            ) : (
              <Box color="text-body-secondary">No permissions boundary configured</Box>
            )}
            <FormField label="Managed policy ARN">
              <Input
                value={boundaryArn}
                onChange={({ detail }) => setBoundaryArn(detail.value)}
                placeholder="Boundary managed policy ARN"
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                value={boundaryName}
                onChange={({ detail }) => setBoundaryName(detail.value)}
                placeholder="Boundary reference name"
              />
              <Input
                value={boundaryPath}
                onChange={({ detail }) => setBoundaryPath(detail.value)}
                placeholder="Boundary reference path"
              />
              <Button
                variant="primary"
                loading={putBoundary.isPending}
                onClick={() =>
                  run(
                    "set permissions boundary",
                    () =>
                      putBoundary.mutateAsync({
                        instanceArn,
                        permissionSetArn,
                        managedPolicyArn: boundaryArn || undefined,
                        customerName: boundaryArn ? undefined : boundaryName || undefined,
                        customerPath: boundaryArn ? undefined : boundaryPath || undefined,
                      }),
                    "Permissions boundary set."
                  )
                }
              >
                Set boundary
              </Button>
              <Button
                loading={delBoundary.isPending}
                onClick={() =>
                  run(
                    "remove permissions boundary",
                    () => delBoundary.mutateAsync({ instanceArn, permissionSetArn }),
                    "Permissions boundary removed."
                  )
                }
              >
                Remove boundary
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>

        <ResourceTable
          resourceName="tag"
          headerTitle="Tags"
          items={tags.data?.tags || []}
          loading={tags.isLoading}
          emptyMessage="No tags"
          columns={[
            { id: "key", header: "Key", cell: (t: any) => t.key, isRowHeader: true },
            { id: "value", header: "Value", cell: (t: any) => t.value },
            {
              id: "actions",
              header: "",
              cell: (t: any) => (
                <DeleteButton
                  itemName={t.key}
                  resourceType="tag"
                  loading={removeTags.isPending}
                  onDelete={() =>
                    run("remove tag", () =>
                      removeTags.mutateAsync({ resourceArn: permissionSetArn, tagKeys: [t.key] })
                    )
                  }
                />
              ),
            },
          ]}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={tagKey}
            onChange={({ detail }) => setTagKey(detail.value)}
            placeholder="Tag key"
          />
          <Input
            value={tagValue}
            onChange={({ detail }) => setTagValue(detail.value)}
            placeholder="Tag value"
          />
          <Button
            variant="primary"
            disabled={!tagKey}
            loading={addTags.isPending}
            onClick={() =>
              run(
                "add tag",
                () =>
                  addTags.mutateAsync({
                    resourceArn: permissionSetArn,
                    tags: { [tagKey]: tagValue },
                  }),
                "Tag added."
              ).then(() => {
                setTagKey("");
                setTagValue("");
              })
            }
          >
            Add tag
          </Button>
        </SpaceBetween>

        <Container header={<Header variant="h3">Provisioning</Header>}>
          <SpaceBetween size="m">
            <SpaceBetween direction="horizontal" size="xs">
              <Input
                value={provisionTarget}
                onChange={({ detail }) => setProvisionTarget(detail.value)}
                placeholder="Target account ID"
              />
              <Button
                variant="primary"
                disabled={!provisionTarget}
                loading={provision.isPending}
                onClick={() =>
                  run(
                    "provision permission set",
                    () =>
                      provision.mutateAsync({
                        instanceArn,
                        permissionSetArn,
                        targetType: "AWS_ACCOUNT",
                        targetId: provisionTarget,
                      }),
                    "Permission set provisioned."
                  )
                }
              >
                Provision
              </Button>
              <Button
                loading={provision.isPending}
                onClick={() =>
                  run(
                    "provision permission set",
                    () =>
                      provision.mutateAsync({
                        instanceArn,
                        permissionSetArn,
                        targetType: "ALL_PROVISIONED_ACCOUNTS",
                      }),
                    "Provisioning requested for all provisioned accounts."
                  )
                }
              >
                Provision all accounts
              </Button>
            </SpaceBetween>
            <Box>
              Provisioned accounts:{" "}
              {provisionedAccounts.data?.accountIds?.join(", ") || "none"}
            </Box>
            <ResourceTable
              resourceName="provisioning operation"
              headerTitle="Provisioning operations"
              items={provisioning.data?.statuses || []}
              loading={provisioning.isLoading}
              emptyMessage="No provisioning operations"
              columns={[
                { id: "request", header: "Request ID", cell: (s: any) => s.RequestId },
                { id: "status", header: "Status", cell: (s: any) => s.Status },
                { id: "date", header: "Created", cell: (s: any) => s.CreatedDate || "—" },
              ]}
            />
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Container>
  );
}

// ── Account Assignments ──────────────────────────────────

function AccountAssignmentsTab({ instanceArn, onStatus }: TabProps) {
  const [accountId, setAccountId] = useState("");
  const [selectedPs, setSelectedPs] = useState<string | null>(null);
  const [principalType, setPrincipalType] = useState("USER");
  const [principalId, setPrincipalId] = useState("");

  const psList = usePermissionSets(instanceArn);
  const assignments = useAccountAssignments(
    instanceArn,
    accountId || null,
    selectedPs
  );
  const createAssignment = useCreateAccountAssignment();
  const deleteAssignment = useDeleteAccountAssignment();
  const creationStatuses = useAssignmentCreationStatuses(instanceArn);
  const deletionStatuses = useAssignmentDeletionStatuses(instanceArn);

  async function handleCreate() {
    try {
      await createAssignment.mutateAsync({
        instanceArn,
        targetId: accountId,
        permissionSetArn: selectedPs!,
        principalId,
        principalType,
      });
      setPrincipalId("");
      onStatus({ type: "success", message: "Account assignment created." });
    } catch (err) {
      onStatus({ type: "error", message: errMsg(err, "Failed to create account assignment") });
    }
  }

  return (
    <SpaceBetween size="l">
      <FormField label="Target account ID">
        <Input
          value={accountId}
          onChange={({ detail }) => setAccountId(detail.value)}
          placeholder="Account ID (12 digits)"
        />
      </FormField>
      <ResourceTable
        resourceName="permission set"
        headerTitle="Choose a permission set"
        items={psList.data?.permissionSets || []}
        loading={psList.isLoading}
        emptyMessage="No permission sets"
        columns={[
          { id: "name", header: "Name", cell: (p: SsoPermissionSet) => p.Name || "—", isRowHeader: true },
          { id: "arn", header: "ARN", cell: (p: SsoPermissionSet) => <Box variant="code">{p.PermissionSetArn}</Box> },
          {
            id: "actions",
            header: "",
            cell: (p: SsoPermissionSet) =>
              selectedPs === p.PermissionSetArn ? (
                <StatusIndicator>Selected</StatusIndicator>
              ) : (
                <Button onClick={() => setSelectedPs(p.PermissionSetArn)}>Select</Button>
              ),
          },
        ]}
      />
      {accountId && selectedPs && (
        <SpaceBetween size="m">
          <ResourceTable
            resourceName="assignment"
            headerTitle="Account assignments"
            items={assignments.data?.assignments || []}
            loading={assignments.isLoading}
            emptyMessage="No account assignments"
            columns={[
              { id: "principalType", header: "Principal type", cell: (a: any) => a.PrincipalType },
              { id: "principalId", header: "Principal ID", cell: (a: any) => <Box variant="code">{a.PrincipalId}</Box>, isRowHeader: true },
              {
                id: "actions",
                header: "",
                cell: (a: any) => (
                  <DeleteButton
                    itemName={a.PrincipalId}
                    resourceType="assignment"
                    loading={deleteAssignment.isPending}
                    onDelete={() =>
                      deleteAssignment
                        .mutateAsync({
                          instanceArn,
                          targetId: a.AccountId,
                          permissionSetArn: a.PermissionSetArn,
                          principalId: a.PrincipalId,
                          principalType: a.PrincipalType,
                        })
                        .catch((err) =>
                          onStatus({
                            type: "error",
                            message: errMsg(err, "Failed to delete account assignment"),
                          })
                        )
                    }
                  />
                ),
              },
            ]}
          />
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant={principalType === "USER" ? "primary" : "normal"}
              onClick={() => setPrincipalType("USER")}
            >
              USER
            </Button>
            <Button
              variant={principalType === "GROUP" ? "primary" : "normal"}
              onClick={() => setPrincipalType("GROUP")}
            >
              GROUP
            </Button>
            <Input
              value={principalId}
              onChange={({ detail }) => setPrincipalId(detail.value)}
              placeholder="Principal ID (user or group UUID)"
            />
            <Button
              variant="primary"
              disabled={!principalId}
              loading={createAssignment.isPending}
              onClick={handleCreate}
            >
              Create assignment
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      )}
      <ResourceTable
        resourceName="creation status"
        headerTitle="Assignment creation statuses"
        items={creationStatuses.data?.statuses || []}
        loading={creationStatuses.isLoading}
        emptyMessage="No assignment creation operations"
        columns={[
          { id: "request", header: "Request ID", cell: (s: any) => s.RequestId },
          { id: "status", header: "Status", cell: (s: any) => s.Status },
          { id: "date", header: "Created", cell: (s: any) => s.CreatedDate || "—" },
        ]}
      />
      <ResourceTable
        resourceName="deletion status"
        headerTitle="Assignment deletion statuses"
        items={deletionStatuses.data?.statuses || []}
        loading={deletionStatuses.isLoading}
        emptyMessage="No assignment deletion operations"
        columns={[
          { id: "request", header: "Request ID", cell: (s: any) => s.RequestId },
          { id: "status", header: "Status", cell: (s: any) => s.Status },
          { id: "date", header: "Created", cell: (s: any) => s.CreatedDate || "—" },
        ]}
      />
    </SpaceBetween>
  );
}

// ── Trusted Token Issuers ────────────────────────────────

function TrustedTokenIssuersTab({ instanceArn, onStatus }: TabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const closeCreateTti = () => setShowCreate(false);
  const [name, setName] = useState("");
  const [issuerUrl, setIssuerUrl] = useState("");
  const [claimPath, setClaimPath] = useState("");
  const [storePath, setStorePath] = useState("");
  const [viewArn, setViewArn] = useState<string | null>(null);
  const closeView = () => setViewArn(null);
  const [editArn, setEditArn] = useState<string | null>(null);
  const closeEdit = () => setEditArn(null);
  const [editName, setEditName] = useState("");
  const [editClaim, setEditClaim] = useState("");
  const [editStore, setEditStore] = useState("");

  const issuers = useTrustedTokenIssuers(instanceArn);
  const createIssuer = useCreateTrustedTokenIssuer();
  const updateIssuer = useUpdateTrustedTokenIssuer();
  const deleteIssuer = useDeleteTrustedTokenIssuer();
  const viewDetail = useTrustedTokenIssuerDetail(viewArn);
  const editDetail = useTrustedTokenIssuerDetail(editArn);

  useEffect(() => {
    const issuer: any = editDetail.data?.trustedTokenIssuer;
    if (issuer) {
      setEditName(issuer.Name || "");
      setEditClaim(issuer.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.ClaimAttributePath || "");
      setEditStore(
        issuer.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.IdentityStoreAttributePath || ""
      );
    }
  }, [editDetail.data]);

  async function handleCreate() {
    try {
      await createIssuer.mutateAsync({
        instanceArn,
        name,
        issuerUrl,
        claimAttributePath: claimPath,
        identityStoreAttributePath: storePath,
      });
      setShowCreate(false);
      setName("");
      setIssuerUrl("");
      setClaimPath("");
      setStorePath("");
      onStatus({ type: "success", message: `Trusted token issuer ${name} created.` });
    } catch (err) {
      onStatus({ type: "error", message: errMsg(err, "Failed to create trusted token issuer") });
    }
  }

  return (
    <SpaceBetween size="m">
      <ResourceTable
        resourceName="trusted token issuer"
        headerTitle="Trusted token issuers"
        items={issuers.data?.trustedTokenIssuers || []}
        loading={issuers.isLoading}
        onCreate={() => setShowCreate(true)}
        emptyMessage="No trusted token issuers"
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.Name, isRowHeader: true },
          { id: "arn", header: "ARN", cell: (i: any) => <Box variant="code">{i.TrustedTokenIssuerArn}</Box> },
          { id: "type", header: "Type", cell: (i: any) => i.TrustedTokenIssuerType },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setViewArn(i.TrustedTokenIssuerArn)}>View</Button>
                <Button onClick={() => setEditArn(i.TrustedTokenIssuerArn)}>Edit</Button>
                <DeleteButton
                  itemName={i.Name}
                  resourceType="trusted token issuer"
                  loading={deleteIssuer.isPending}
                  onDelete={async () => {
                    try {
                      await deleteIssuer.mutateAsync(i.TrustedTokenIssuerArn);
                      if (editArn === i.TrustedTokenIssuerArn) setEditArn(null);
                      if (viewArn === i.TrustedTokenIssuerArn) setViewArn(null);
                    } catch (err) {
                      onStatus({
                        type: "error",
                        message: errMsg(err, "Failed to delete trusted token issuer"),
                      });
                    }
                  }}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal visible={!!viewArn} onDismiss={closeView} header={`Trusted token issuer ${viewDetail.data?.trustedTokenIssuer?.Name || ""}`}>
        <SpaceBetween size="m">
          <Box>
            <Box variant="awsui-key-label">Issuer URL</Box>
            <Box variant="code">
              {viewDetail.data?.trustedTokenIssuer?.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.IssuerUrl || "—"}
            </Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Claim attribute path</Box>
            <Box>
              {viewDetail.data?.trustedTokenIssuer?.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.ClaimAttributePath || "—"}
            </Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Identity store attribute path</Box>
            <Box>
              {viewDetail.data?.trustedTokenIssuer?.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.IdentityStoreAttributePath || "—"}
            </Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">JWKS retrieval option</Box>
            <Box>
              {viewDetail.data?.trustedTokenIssuer?.TrustedTokenIssuerConfiguration?.OidcJwtConfiguration?.JwksRetrievalOption || "—"}
            </Box>
          </Box>
          <Box float="right">
            <Button onClick={closeView}>Done</Button>
          </Box>
        </SpaceBetween>
      </Modal>
      <Modal visible={!!editArn} onDismiss={closeEdit} header="Edit trusted token issuer">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={editName}
                onChange={({ detail }) => setEditName(detail.value)}
                placeholder="Issuer name"
              />
            </FormField>
            <FormField label="Claim attribute path">
              <Input
                value={editClaim}
                onChange={({ detail }) => setEditClaim(detail.value)}
                placeholder="Claim attribute path"
              />
            </FormField>
            <FormField label="Identity store attribute path">
              <Input
                value={editStore}
                onChange={({ detail }) => setEditStore(detail.value)}
                placeholder="Identity store attribute path"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeEdit}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={updateIssuer.isPending}
                  onClick={async () => {
                    try {
                      await updateIssuer.mutateAsync({
                        trustedTokenIssuerArn: editArn!,
                        name: editName || undefined,
                        claimAttributePath: editClaim || undefined,
                        identityStoreAttributePath: editStore || undefined,
                      });
                      setEditArn(null);
                      onStatus({ type: "success", message: "Trusted token issuer updated." });
                    } catch (err) {
                      onStatus({
                        type: "error",
                        message: errMsg(err, "Failed to update trusted token issuer"),
                      });
                    }
                  }}
                >
                  Save issuer
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Form>
      </Modal>
      <Modal visible={showCreate} onDismiss={closeCreateTti} header="Create trusted token issuer">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={name}
                onChange={({ detail }) => setName(detail.value)}
                placeholder="Issuer name"
              />
            </FormField>
            <FormField label="Issuer URL">
              <Input
                value={issuerUrl}
                onChange={({ detail }) => setIssuerUrl(detail.value)}
                placeholder="Issuer URL"
              />
            </FormField>
            <FormField label="Claim attribute path">
              <Input
                value={claimPath}
                onChange={({ detail }) => setClaimPath(detail.value)}
                placeholder="Claim attribute path"
              />
            </FormField>
            <FormField label="Identity store attribute path">
              <Input
                value={storePath}
                onChange={({ detail }) => setStorePath(detail.value)}
                placeholder="Identity store attribute path"
              />
            </FormField>
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={closeCreateTti}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!name || !issuerUrl || !claimPath || !storePath}
                  loading={createIssuer.isPending}
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

// ── Access Control Attributes ────────────────────────────

interface AttributeRow {
  key: string;
  source: string;
}

function AccessControlAttributesTab({ instanceArn, onStatus }: TabProps) {
  const config = useAccessControlAttributeConfiguration(instanceArn);
  const createCfg = useCreateAccessControlConfig();
  const updateCfg = useUpdateAccessControlConfig();
  const deleteCfg = useDeleteAccessControlConfig();
  const [rows, setRows] = useState<AttributeRow[]>([{ key: "", source: "" }]);

  useEffect(() => {
    const attrs = config.data?.configuration?.AccessControlAttributes;
    if (attrs) {
      setRows(
        attrs.map((a) => ({ key: a.Key, source: a.Value?.Source?.[0] || "" }))
      );
    }
  }, [config.data]);

  function updateRow(idx: number, patch: Partial<AttributeRow>) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  const rowsFilled = rows.every((r) => r.key && r.source);

  async function handleSave(mode: "create" | "update") {
    try {
      const params = { instanceArn, attributes: rows };
      if (mode === "create") {
        await createCfg.mutateAsync(params);
        onStatus({ type: "success", message: "Access control attribute configuration created." });
      } else {
        await updateCfg.mutateAsync(params);
        onStatus({ type: "success", message: "Access control attribute configuration updated." });
      }
    } catch (err) {
      onStatus({
        type: "error",
        message: errMsg(err, "Failed to save access control attribute configuration"),
      });
    }
  }

  if (config.isLoading) {
    return <Box>Loading access control attribute configuration...</Box>;
  }

  const configured = !config.isError && !!config.data?.configuration;

  return (
    <SpaceBetween size="l">
      {configured ? (
        <>
          <ResourceTable
            resourceName="attribute"
            headerTitle="Access control attributes"
            items={config.data?.configuration?.AccessControlAttributes || []}
            emptyMessage="No access control attributes"
            columns={[
              { id: "key", header: "Key", cell: (a: any) => a.Key, isRowHeader: true },
              {
                id: "source",
                header: "Source",
                cell: (a: any) => <Box variant="code">{a.Value?.Source?.join(", ")}</Box>,
              },
            ]}
          />
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => handleSave("update")} loading={updateCfg.isPending}>
              Update configuration
            </Button>
            <DeleteButton
              itemName="access control attribute configuration"
              resourceType="configuration"
              loading={deleteCfg.isPending}
              onDelete={async () => {
                try {
                  await deleteCfg.mutateAsync(instanceArn);
                  setRows([{ key: "", source: "" }]);
                } catch (err) {
                  onStatus({
                    type: "error",
                    message: errMsg(err, "Failed to delete access control attribute configuration"),
                  });
                }
              }}
            />
          </SpaceBetween>
        </>
      ) : (
        <Container header={<Header variant="h3">Configure access control attributes</Header>}>
          <SpaceBetween size="m">
            <Box color="text-body-secondary">
              {config.isError
                ? "No configuration exists for this instance yet. Define attributes to enable attribute-based access control (ABAC)."
                : "Define attributes to enable attribute-based access control (ABAC)."}
            </Box>
            {rows.map((row, idx) => (
              <SpaceBetween direction="horizontal" size="xs" key={idx}>
                <Input
                  value={row.key}
                  onChange={({ detail }) => updateRow(idx, { key: detail.value })}
                  placeholder="Attribute key"
                />
                <Input
                  value={row.source}
                  onChange={({ detail }) => updateRow(idx, { source: detail.value })}
                  placeholder="Attribute source (e.g. $.costCenter)"
                />
                <Button
                  onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  disabled={rows.length === 1}
                >
                  Remove attribute
                </Button>
              </SpaceBetween>
            ))}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setRows([...rows, { key: "", source: "" }])}>
                Add attribute
              </Button>
              <Button
                variant="primary"
                disabled={!rowsFilled}
                loading={createCfg.isPending}
                onClick={() => handleSave("create")}
              >
                Create configuration
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

// ── Regions ──────────────────────────────────────────────

function RegionsTab({ instanceArn, onStatus }: TabProps) {
  const [regionName, setRegionName] = useState("");
  const regions = useSsoRegions(instanceArn);
  const addRegion = useAddSsoRegion();
  const removeRegion = useRemoveSsoRegion();

  async function handleAdd() {
    try {
      await addRegion.mutateAsync({ instanceArn, regionName });
      setRegionName("");
      onStatus({ type: "success", message: `Region ${regionName} is being added.` });
    } catch (err) {
      onStatus({ type: "error", message: errMsg(err, "Failed to add region") });
    }
  }

  return (
    <SpaceBetween size="m">
      <ResourceTable
        resourceName="region"
        headerTitle="Regions"
        items={regions.data?.regions || []}
        loading={regions.isLoading}
        emptyMessage="No regions"
        headerActions={
          <SpaceBetween direction="horizontal" size="xs">
            <Input
              value={regionName}
              onChange={({ detail }) => setRegionName(detail.value)}
              placeholder="Region code (e.g. eu-west-1)"
            />
            <Button
              variant="primary"
              disabled={!regionName}
              loading={addRegion.isPending}
              onClick={handleAdd}
            >
              Add region
            </Button>
          </SpaceBetween>
        }
        columns={[
          { id: "region", header: "Region", cell: (r: any) => r.RegionName, isRowHeader: true },
          { id: "status", header: "Status", cell: (r: any) => r.Status },
          { id: "primary", header: "Primary", cell: (r: any) => (r.IsPrimaryRegion ? "Yes" : "No") },
          { id: "added", header: "Added", cell: (r: any) => r.AddedDate || "—" },
          {
            id: "actions",
            header: "",
            cell: (r: any) => (
              <DeleteButton
                itemName={r.RegionName}
                resourceType="region"
                loading={removeRegion.isPending}
                onDelete={async () => {
                  try {
                    await removeRegion.mutateAsync({ instanceArn, regionName: r.RegionName });
                  } catch (err) {
                    onStatus({ type: "error", message: errMsg(err, "Failed to remove region") });
                  }
                }}
              />
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}

export default SSOAdminDashboard;
