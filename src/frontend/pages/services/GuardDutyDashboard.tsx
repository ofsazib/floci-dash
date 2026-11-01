import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Button,
  Toggle,
} from "@cloudscape-design/components";
import {
  useGuardDutyDetectors,
  useGuardDutyDetector,
  useCreateGuardDutyDetector,
  useUpdateGuardDutyDetector,
  useDeleteGuardDutyDetector,
  useGuardDutyMembers,
  useCreateGuardDutyMembers,
  useGuardDutyOrgConfig,
  useUpdateGuardDutyOrgConfig,
  useEnableGuardDutyAdminAccount,
  useDisableGuardDutyAdminAccount,
} from "../../hooks/useGuardDuty";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function GuardDutyDashboard() {
  const { data, isLoading } = useGuardDutyDetectors();
  const createDetector = useCreateGuardDutyDetector();
  const updateDetector = useUpdateGuardDutyDetector();
  const deleteDetector = useDeleteGuardDutyDetector();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useGuardDutyDetector(selected);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ enable: "true", frequency: "SIX_HOURS" });
  const { data: membersData } = useGuardDutyMembers(selected);
  const createMembers = useCreateGuardDutyMembers();
  const { data: orgConfig } = useGuardDutyOrgConfig(selected);
  const updateOrgConfig = useUpdateGuardDutyOrgConfig();
  const enableAdmin = useEnableGuardDutyAdminAccount();
  const disableAdmin = useDisableGuardDutyAdminAccount();
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberAccountId, setMemberAccountId] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAccountId, setAdminAccountId] = useState("");
  const [orgAutoEnable, setOrgAutoEnable] = useState(false);

  const handleAddMember = async () => {
    if (!selected || !memberAccountId) return;
    try {
      await createMembers.mutateAsync({
        detectorId: selected,
        accounts: [{ accountId: memberAccountId, email: memberEmail || undefined }],
      });
      setShowAddMember(false);
      setMemberAccountId("");
      setMemberEmail("");
    } catch {}
  };

  const handleEnableAdmin = async () => {
    if (!adminAccountId) return;
    try {
      await enableAdmin.mutateAsync(adminAccountId);
      setShowAdmin(false);
      setAdminAccountId("");
    } catch {}
  };

  const handleCreate = async () => {
    try {
      await createDetector.mutateAsync({
        enable: form.enable === "true",
        frequency: form.frequency,
      });
      setShowCreate(false);
      setForm({ enable: "true", frequency: "SIX_HOURS" });
    } catch {}
  };

  const detectors = (data as any)?.detectorIds || [];

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Detector"
        headerTitle="GuardDuty Detectors"
        headerCounter={(data as any)?.total}
        items={detectors.map((id: string) => ({ id, name: id }))}
        loading={isLoading}
        emptyMessage="No GuardDuty detectors"
        columns={[
          {
            id: "id",
            header: "Detector ID",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => setSelected(item.id === selected ? null : item.id)}
              >
                {item.id}
              </Button>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: () => (
              <StatusIndicator type={(detailData as any)?.detector?.status === "ENABLED" ? "success" : "stopped"}>
                {(detailData as any)?.detector?.status ?? "—"}
              </StatusIndicator>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="detector"
                loading={deleteDetector.isPending}
                onDelete={async () => {
                  try {
                    await deleteDetector.mutateAsync(item.id);
                    if (selected === item.id) setSelected(null);
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find detectors by ID"
        filterFunction={(i: any, s: string) =>
          (i.id ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Detector — {selected}</Header>
          <SpaceBetween size="xs">
            <Box>Status: {(detailData as any)?.detector?.status || "—"}</Box>
            <Box>Created: {(detailData as any)?.detector?.createdAt || "—"}</Box>
            <Box>
              Frequency:{" "}
              {(detailData as any)?.detector?.findingPublishingFrequency || "—"}
            </Box>
            <Box>Service role: {(detailData as any)?.detector?.serviceRole || "—"}</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                loading={updateDetector.isPending}
                onClick={() =>
                  updateDetector.mutate({
                    id: selected,
                    enable:
                      ((detailData as any)?.detector?.status ?? "ENABLED") !== "ENABLED",
                  })
                }
              >
                Toggle enabled
              </Button>
            </SpaceBetween>

            <Header variant="h3">Members</Header>
            <ResourceTable
              resourceName="Member"
              headerTitle="GuardDuty Members"
              headerCounter={(membersData as any)?.total}
              items={((membersData as any)?.members || []).map((m: any) => ({
                accountId: m.accountId || "",
                email: m.email || "—",
                status: m.status || "—",
              }))}
              emptyMessage="No members"
              onCreate={() => setShowAddMember(true)}
              columns={[
                { id: "accountId", header: "Account ID", cell: (i: any) => i.accountId },
                { id: "email", header: "Email", cell: (i: any) => i.email },
                { id: "status", header: "Relationship", cell: (i: any) => i.status },
              ]}
            />

            <Header variant="h3">Organization</Header>
            <SpaceBetween size="xs">
              <Box>
                Auto-enable member accounts:{" "}
                {orgConfig ? (orgConfig.autoEnable ? "Yes" : "No") : "—"}
              </Box>
              <Toggle checked={orgAutoEnable} onChange={(e) => setOrgAutoEnable(e.detail.checked)}>
                Auto-enable
              </Toggle>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  loading={updateOrgConfig.isPending}
                  onClick={() => updateOrgConfig.mutate({ detectorId: selected, autoEnable: orgAutoEnable })}
                >
                  Update organization config
                </Button>
                <Button onClick={() => setShowAdmin(true)}>Enable admin account</Button>
                <Button
                  onClick={async () => {
                    try { await disableAdmin.mutateAsync(adminAccountId); } catch {}
                  }}
                  disabled={!adminAccountId}
                >
                  Disable admin account
                </Button>
              </SpaceBetween>
            </SpaceBetween>
          </SpaceBetween>
        </Box>
      )}

      <Modal visible={showAddMember} onDismiss={() => setShowAddMember(false)} header="Add Member Account">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Account ID">
              <Input value={memberAccountId} onChange={(e) => setMemberAccountId(e.detail.value)} placeholder="111111111111" />
            </FormField>
            <FormField label="Email">
              <Input value={memberEmail} onChange={(e) => setMemberEmail(e.detail.value)} placeholder="member@example.com" />
            </FormField>
            <Button onClick={handleAddMember} disabled={!memberAccountId || createMembers.isPending}>
              Add Member
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showAdmin} onDismiss={() => setShowAdmin(false)} header="Enable Organization Admin Account">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Admin Account ID">
              <Input value={adminAccountId} onChange={(e) => setAdminAccountId(e.detail.value)} placeholder="111111111111" />
            </FormField>
            <Button onClick={handleEnableAdmin} disabled={!adminAccountId || enableAdmin.isPending}>
              Enable Admin
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Detector">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Enable (true/false)">
              <Input
                value={form.enable}
                onChange={(e) => setForm({ ...form, enable: e.detail.value.toLowerCase() })}
              />
            </FormField>
            <FormField label="Finding Publishing Frequency">
              <Input
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.detail.value.toUpperCase() })}
                placeholder="FIFTEEN_MINUTES | ONE_HOUR | SIX_HOURS"
              />
            </FormField>
            <Button onClick={handleCreate} disabled={createDetector.isPending}>
              Create
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
