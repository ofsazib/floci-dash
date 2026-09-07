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
  StatusIndicator,
  Tabs,
  Textarea,
  Toggle,
} from "@cloudscape-design/components";
import {
  useRAMShares,
  useCreateRAMShare,
  useDeleteRAMShare,
  useAssociateRAMShare,
  useDisassociateRAMShare,
  useRAMPrincipals,
  useRAMResources,
  useRAMInvitations,
  useEnableRAMSharing,
} from "../../hooks/useRAM";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

function statusIndicator(status: string) {
  const color =
    status === "ACTIVE"
      ? "success"
      : status === "PENDING" || status === "DELETING"
        ? "in-progress"
        : "error";
  return <StatusIndicator type={color as any}>{status}</StatusIndicator>;
}

/** One modal per share: associate/disassociate resources and principals via newline lists. */
function AssociationEditor({
  arn,
  associate,
}: {
  arn: string;
  associate: boolean;
}) {
  const { showToast } = useToast();
  const associateShare = useAssociateRAMShare();
  const disassociateShare = useDisassociateRAMShare();
  const [principals, setPrincipals] = useState("");
  const [resourceArns, setResourceArns] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = associate ? associateShare : disassociateShare;

  const submit = async () => {
    const principalList = principals
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const resourceList = resourceArns
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await mutation.mutateAsync({
        arn,
        principals: principalList.length > 0 ? principalList : undefined,
        resourceArns: resourceList.length > 0 ? resourceList : undefined,
      });
      showToast(
        "success",
        `${associate ? "Associated" : "Disassociated"} ${principalList.length + resourceList.length} entr${principalList.length + resourceList.length === 1 ? "y" : "ies"}`
      );
      setPrincipals("");
      setResourceArns("");
      setError(null);
    } catch (e: any) {
      setError(e?.message || `Failed to ${associate ? "associate" : "disassociate"}`);
    }
  };

  return (
    <SpaceBetween size="m">
      <FormField label="Principals to add (one per line)">
        <Textarea
          value={principals}
          onChange={(e) => setPrincipals(e.detail.value)}
          placeholder={"123456789012\n987654321098"}
          rows={3}
        />
      </FormField>
      <FormField label="Resource ARNs to update (one per line)">
        <Textarea
          value={resourceArns}
          onChange={(e) => setResourceArns(e.detail.value)}
          placeholder={"arn:aws:s3:::my-bucket"}
          rows={3}
        />
      </FormField>
      {error && <Alert type="error">{error}</Alert>}
      <Button
        onClick={submit}
        disabled={mutation.isPending || (!principals.trim() && !resourceArns.trim())}
      >
        {associate ? "Associate" : "Disassociate"}
      </Button>
    </SpaceBetween>
  );
}

export function RAMDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useRAMShares();
  const createShare = useCreateRAMShare();
  const deleteShare = useDeleteRAMShare();
  const enableSharing = useEnableRAMSharing();
  const invitations = useRAMInvitations();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [resourceArns, setResourceArns] = useState("");
  const [principals, setPrincipals] = useState("");
  const [allowExternal, setAllowExternal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [assocTarget, setAssocTarget] = useState<any>(null);
  const [assocMode, setAssocMode] = useState<"associate" | "disassociate">("associate");

  const [detailTarget, setDetailTarget] = useState<any>(null);

  const shares: any[] = data?.resourceShares || [];

  const closeCreate = () => {
    setShowCreate(false);
    setName("");
    setResourceArns("");
    setPrincipals("");
    setAllowExternal(false);
    setCreateError(null);
  };

  const submitCreate = async () => {
    const resourceList = resourceArns.split("\n").map((s) => s.trim()).filter(Boolean);
    const principalList = principals.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      await createShare.mutateAsync({
        name: name.trim(),
        allowExternalPrincipals: allowExternal,
        resourceArns: resourceList.length > 0 ? resourceList : undefined,
        principals: principalList.length > 0 ? principalList : undefined,
      });
      showToast("success", `Resource share ${name.trim()} created`);
      closeCreate();
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create resource share");
    }
  };

  const handleDelete = async (share: any) => {
    try {
      await deleteShare.mutateAsync(share.arn);
      showToast("success", `Resource share ${share.name} deleted`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete resource share");
    }
  };

  const handleEnableSharing = async () => {
    try {
      const res: any = await enableSharing.mutateAsync();
      showToast(
        res?.returnValue === false ? "error" : "success",
        res?.returnValue === false
          ? "Organization sharing could not be enabled"
          : "Organization sharing enabled"
      );
    } catch (e: any) {
      showToast("error", e?.message || "Failed to enable organization sharing");
    }
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">Resource Access Manager</Header>
        <Box color="text-body-secondary">
          Share resources between accounts using resource shares backed by the Floci emulator.
        </Box>
      </Box>

      <ResourceTable
        resourceName="Resource share"
        headerTitle="Resource shares"
        headerCounter={data?.total}
        items={shares.map((s) => ({
          id: s.resourceShareArn,
          name: s.name,
          arn: s.resourceShareArn,
          owningAccountId: s.owningAccountId,
          allowExternalPrincipals: s.allowExternalPrincipals,
          status: s.status,
        }))}
        loading={isLoading}
        emptyMessage="No resource shares"
        onCreate={() => {
          setName("");
          setResourceArns("");
          setPrincipals("");
          setAllowExternal(false);
          setCreateError(null);
          setShowCreate(true);
        }}
        columns={[
          { id: "name", header: "Name", cell: (i: any) => i.name || "—", isRowHeader: true },
          {
            id: "arn",
            header: "ARN",
            cell: (i: any) => <Box variant="code">{i.arn}</Box>,
          },
          { id: "owningAccountId", header: "Owner", cell: (i: any) => i.owningAccountId || "—" },
          {
            id: "external",
            header: "External principals",
            cell: (i: any) => (i.allowExternalPrincipals ? "Allowed" : "Not allowed"),
          },
          { id: "status", header: "Status", cell: (i: any) => statusIndicator(i.status) },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setAssocTarget(i);
                    setAssocMode("associate");
                  }}
                >
                  Associate
                </Button>
                <Button
                  variant="link"
                  onClick={() => {
                    setAssocTarget(i);
                    setAssocMode("disassociate");
                  }}
                >
                  Disassociate
                </Button>
                <Button variant="link" onClick={() => setDetailTarget(i)}>
                  Details
                </Button>
                <DeleteButton
                  itemName={i.name || i.arn}
                  resourceType="resource share"
                  loading={deleteShare.isPending && deleteShare.variables === i.arn}
                  onDelete={() => handleDelete(i)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find shares by name or ARN"
        filterFunction={(i: any, s: string) =>
          `${i.name ?? ""} ${i.arn}`.toLowerCase().includes(s.toLowerCase())
        }
      />

      <Tabs
        tabs={[
          {
            id: "invitations",
            label: `Invitations (${invitations.data?.total ?? 0})`,
            content: (
              <ResourceTable
                resourceName="Invitation"
                headerTitle="Resource share invitations"
                headerCounter={invitations.data?.total}
                items={invitations.data?.resourceShareInvitations || []}
                loading={invitations.isLoading}
                emptyMessage="No pending resource share invitations"
                columns={[
                  {
                    id: "invitationArn",
                    header: "Invitation ARN",
                    cell: (i: any) => <Box variant="code">{i.resourceShareInvitationArn}</Box>,
                    isRowHeader: true,
                  },
                  {
                    id: "shareName",
                    header: "Share",
                    cell: (i: any) => i.resourceShareName || "—",
                  },
                  {
                    id: "senderAccountId",
                    header: "Sender",
                    cell: (i: any) => i.senderAccountId || "—",
                  },
                  { id: "status", header: "Status", cell: (i: any) => i.status || "—" },
                ]}
              />
            ),
          },
        ]}
      />

      <Modal visible={showCreate} onDismiss={closeCreate} header="Create resource share">
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.detail.value)}
              placeholder="my-share"
            />
          </FormField>
          <FormField label="Resource ARNs (one per line)">
            <Textarea
              value={resourceArns}
              onChange={(e) => setResourceArns(e.detail.value)}
              placeholder={"arn:aws:s3:::my-bucket"}
              rows={3}
            />
          </FormField>
          <FormField label="Principals (one per line)">
            <Textarea
              value={principals}
              onChange={(e) => setPrincipals(e.detail.value)}
              placeholder={"123456789012"}
              rows={2}
            />
          </FormField>
          <Toggle onChange={({ detail }) => setAllowExternal(detail.checked)} checked={allowExternal}>
            Allow external principals
          </Toggle>
          {createError && <Alert type="error">{createError}</Alert>}
          <Button onClick={submitCreate} disabled={!name.trim() || createShare.isPending}>
            Create resource share
          </Button>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={!!assocTarget}
        onDismiss={() => setAssocTarget(null)}
        header={
          assocMode === "associate"
            ? "Associate with resource share"
            : "Disassociate from resource share"
        }
      >
        {assocTarget && <AssociationEditor arn={assocTarget.arn} associate={assocMode === "associate"} />}
      </Modal>

      <Modal visible={!!detailTarget} onDismiss={() => setDetailTarget(null)} header="Share details">
        {detailTarget && (
          <SpaceBetween size="m">
            <Box>
              <b>{detailTarget.name}</b>
            </Box>
            <Box variant="code">{detailTarget.arn}</Box>
            <ShareDetailPanels arn={detailTarget.arn} />
          </SpaceBetween>
        )}
      </Modal>

      <Toggle
        onChange={() => handleEnableSharing()}
        checked={false}
        disabled={enableSharing.isPending}
      >
        Enable sharing with AWS Organizations
      </Toggle>
    </SpaceBetween>
  );
}

/** Principals + resources for one share, shown inside the details modal. */
function ShareDetailPanels({ arn }: { arn: string }) {
  const principals = useRAMPrincipals(arn);
  const resources = useRAMResources(arn);

  return (
    <Tabs
      tabs={[
        {
          id: "principals",
          label: `Principals (${principals.data?.total ?? 0})`,
          content: (
            <ResourceTable
              resourceName="Principal"
              items={principals.data?.principals || []}
              loading={principals.isLoading}
              emptyMessage="No principals associated"
              columns={[
                { id: "id", header: "ID", cell: (i: any) => i.id, isRowHeader: true },
                {
                  id: "external",
                  header: "External",
                  cell: (i: any) => (i.external ? "Yes" : "No"),
                },
                { id: "status", header: "Status", cell: (i: any) => i.status || "—" },
              ]}
            />
          ),
        },
        {
          id: "resources",
          label: `Resources (${resources.data?.total ?? 0})`,
          content: (
            <ResourceTable
              resourceName="Resource"
              items={resources.data?.resources || []}
              loading={resources.isLoading}
              emptyMessage="No shared resources"
              columns={[
                {
                  id: "arn",
                  header: "ARN",
                  cell: (i: any) => <Box variant="code">{i.arn}</Box>,
                  isRowHeader: true,
                },
                { id: "type", header: "Type", cell: (i: any) => i.type || "—" },
                { id: "status", header: "Status", cell: (i: any) => i.status || "—" },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
