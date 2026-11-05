import { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormField,
  Header,
  Input,
  Link,
  Modal,
  SpaceBetween,
  StatusIndicator,
  Table,
  Textarea,
} from "@cloudscape-design/components";
import {
  useCreateOrgPolicy,
  useDeleteOrgPolicy,
  useDisableOrgPolicyType,
  useEnableOrgPolicyType,
  useOrgPolicies,
  type OrgPolicy,
  type OrgRoot,
} from "../../../hooks/useOrganizations";
import { useToast } from "../../../components/Toast";
import TypedConfirmModal from "../../../components/TypedConfirmModal";
import { POLICY_TYPES, jsonError, policyTypeLabel } from "./orgUtils";

const isEnabled = (root: OrgRoot, type: string) =>
  // SCPs are always on in an all-features organization; ListRoots may omit them.
  type === "SERVICE_CONTROL_POLICY" || !!root.PolicyTypes?.some((p) => p.Type === type && p.Status === "ENABLED");

/** "Policies" page: every policy type with its status, grouped like the AWS console. */
export function PoliciesView({ root, onOpen }: { root: OrgRoot; onOpen: (type: string) => void }) {
  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Policies let you apply additional types of management to the accounts in your organization. Enable a policy type before you create and attach policies of that type.">
        Policies
      </Header>
      {(["Authorization policies", "Management policies"] as const).map((category) => (
        <Table
          key={category}
          variant="container"
          header={<Header variant="h2">{category}</Header>}
          items={POLICY_TYPES.filter((p) => p.category === category)}
          columnDefinitions={[
            {
              id: "name",
              header: "Policy type",
              isRowHeader: true,
              cell: (p) => (
                <Link onFollow={(e) => { e.preventDefault(); onOpen(p.type); }} href={`#policies/${p.type}`}>
                  {p.label}
                </Link>
              ),
            },
            { id: "description", header: "Description", cell: (p) => p.description },
            {
              id: "status",
              header: "Status",
              cell: (p) =>
                isEnabled(root, p.type) ? <StatusIndicator type="success">Enabled</StatusIndicator> : <StatusIndicator type="stopped">Disabled</StatusIndicator>,
            },
          ]}
        />
      ))}
    </SpaceBetween>
  );
}

const SCP_TEMPLATE = JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Deny", Action: [], Resource: "*" }] }, null, 2);

/** One policy type: enable/disable it and manage its policies. */
export function PolicyTypeView({ root, type }: { root: OrgRoot; type: string }) {
  const { showToast } = useToast();
  const label = policyTypeLabel(type);
  const enabled = isEnabled(root, type);
  const policies = useOrgPolicies(type);
  const enable = useEnableOrgPolicyType();
  const disable = useDisableOrgPolicyType();
  const createPolicy = useCreateOrgPolicy();
  const deletePolicy = useDeletePolicyState();
  const [selected, setSelected] = useState<OrgPolicy[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState(SCP_TEMPLATE);
  const [submitted, setSubmitted] = useState(false);

  const fail = (e: unknown, fallback: string) => showToast("error", (e as Error)?.message || fallback);

  async function toggleType() {
    try {
      if (enabled) await disable.mutateAsync({ policyType: type, rootId: root.Id });
      else await enable.mutateAsync({ policyType: type, rootId: root.Id });
      showToast("success", `${label} ${enabled ? "disabled" : "enabled"}.`);
    } catch (e) {
      fail(e, `Failed to ${enabled ? "disable" : "enable"} ${label.toLowerCase()}`);
    }
  }

  const contentError = submitted ? jsonError(content) : null;
  const nameError = submitted && !name.trim() ? "Enter a policy name." : undefined;

  async function submit() {
    setSubmitted(true);
    if (!name.trim() || jsonError(content)) return;
    try {
      await createPolicy.mutateAsync({ name: name.trim(), description: description.trim() || undefined, content, type });
      showToast("success", `Successfully created policy '${name.trim()}'.`);
      setCreating(false);
      setName("");
      setDescription("");
      setContent(SCP_TEMPLATE);
      setSubmitted(false);
    } catch (e) {
      fail(e, "Failed to create policy");
    }
  }

  async function remove() {
    const p = selected[0];
    try {
      await deletePolicy.mutation.mutateAsync(p.Id);
      showToast("success", `Successfully deleted policy '${p.Name}'.`);
      setSelected([]);
      deletePolicy.setOpen(false);
    } catch (e) {
      fail(e, "Failed to delete policy");
    }
  }

  const canDelete = selected.length === 1 && !selected[0].AwsManaged;
  const toggleButton = (
    <Button onClick={toggleType} loading={enable.isPending || disable.isPending} variant={enabled ? "normal" : "primary"}>
      {enabled ? `Disable ${label.toLowerCase()}` : `Enable ${label.toLowerCase()}`}
    </Button>
  );

  return (
    <SpaceBetween size="l">
      <Header variant="h1" actions={enabled && type !== "SERVICE_CONTROL_POLICY" ? toggleButton : undefined}>
        {label}
      </Header>
      {!enabled ? (
        <Container>
          <SpaceBetween size="m">
            <Box variant="p">{label} are disabled in this organization. Enable them to create and attach policies of this type.</Box>
            <div>{toggleButton}</div>
          </SpaceBetween>
        </Container>
      ) : (
        <Table
          variant="container"
          selectionType="single"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          trackBy="Id"
          loading={policies.isLoading}
          loadingText="Loading policies"
          items={policies.data?.policies ?? []}
          empty={<Box textAlign="center" color="text-body-secondary">No policies</Box>}
          header={
            <Header
              variant="h2"
              counter={`(${policies.data?.policies?.length ?? 0})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button disabled={!canDelete} onClick={() => deletePolicy.setOpen(true)}>Delete</Button>
                  <Button variant="primary" onClick={() => setCreating(true)}>Create policy</Button>
                </SpaceBetween>
              }
            >
              Available policies
            </Header>
          }
          columnDefinitions={[
            { id: "name", header: "Name", isRowHeader: true, cell: (p) => p.Name },
            { id: "kind", header: "Type", cell: (p) => (p.AwsManaged ? "AWS managed" : "Customer managed") },
            { id: "description", header: "Description", cell: (p) => p.Description || "-" },
          ]}
        />
      )}

      <Modal
        visible={creating}
        size="large"
        onDismiss={() => setCreating(false)}
        header={`Create new ${label.toLowerCase().replace(/ies$/, "y")}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="primary" loading={createPolicy.isPending} onClick={submit}>Create policy</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Policy name" errorText={nameError}>
            <Input value={name} onChange={({ detail }) => setName(detail.value)} ariaLabel="Policy name" />
          </FormField>
          <FormField label="Policy description - optional">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} ariaLabel="Policy description" />
          </FormField>
          <FormField label="Policy content (JSON)" errorText={contentError ?? undefined}>
            <Textarea value={content} rows={14} onChange={({ detail }) => setContent(detail.value)} ariaLabel="Policy content" />
          </FormField>
        </SpaceBetween>
      </Modal>

      <TypedConfirmModal
        visible={deletePolicy.open}
        header={`Delete policy '${selected[0]?.Name}'?`}
        confirmValue={selected[0]?.Name ?? ""}
        confirmLabel="Delete policy"
        loading={deletePolicy.mutation.isPending}
        onConfirm={remove}
        onDismiss={() => deletePolicy.setOpen(false)}
      >
        A policy can be deleted only after it is detached from every root, OU and account.
      </TypedConfirmModal>
    </SpaceBetween>
  );
}

function useDeletePolicyState() {
  const mutation = useDeleteOrgPolicy();
  const [open, setOpen] = useState(false);
  return { mutation, open, setOpen };
}
