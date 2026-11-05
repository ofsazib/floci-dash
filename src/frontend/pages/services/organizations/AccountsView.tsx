import { useState } from "react";
import {
  Box,
  Button,
  ButtonDropdown,
  Container,
  FormField,
  Header,
  Input,
  Modal,
  SegmentedControl,
  SpaceBetween,
  TextFilter,
} from "@cloudscape-design/components";
import type { ButtonDropdownProps } from "@cloudscape-design/components";
import {
  useCloseOrgAccount,
  useCreateOrgOU,
  useDeleteOrgOU,
  useMoveOrgAccount,
  useOrgAccounts,
  useOrgOU,
  useRemoveOrgAccount,
  useUpdateOrgOU,
  type OrgOrganization,
  type OrgRoot,
} from "../../../hooks/useOrganizations";
import { api } from "../../../lib/client";
import { useToast } from "../../../components/Toast";
import { AccountRow, ContainerNode, DestinationPicker, type SelItem } from "./OrgTree";
import TypedConfirmModal from "../../../components/TypedConfirmModal";
import TagsEditor, { tagsToRecord, type TagRow } from "../../../components/TagsEditor";
import { accountsCsv, downloadText } from "./orgUtils";

type Dialog = "create-ou" | "rename-ou" | "delete-ou" | "move" | "remove" | "close" | null;

interface Props {
  org: OrgOrganization;
  root: OrgRoot;
  onAddAccount: () => void;
}

const errorText = (e: unknown, fallback: string) => (e as Error)?.message || fallback;

/** "AWS accounts" page: the organization tree with the Actions menu, as in the AWS console. */
export default function AccountsView({ org, root, onAddAccount }: Props) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<"hierarchy" | "list">("hierarchy");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, SelItem>>({});
  const [dialog, setDialog] = useState<Dialog>(null);
  const [ouName, setOuName] = useState("");
  const [ouTags, setOuTags] = useState<TagRow[]>([]);
  const [destination, setDestination] = useState<{ id: string; name: string } | null>(null);

  const allAccounts = useOrgAccounts(null);
  const term = search.trim();
  const searchedOU = useOrgOU(/^ou-/i.test(term) ? term : null);
  const createOU = useCreateOrgOU();
  const updateOU = useUpdateOrgOU();
  const deleteOU = useDeleteOrgOU();
  const moveAccount = useMoveOrgAccount();
  const removeAccount = useRemoveOrgAccount();
  const closeAccount = useCloseOrgAccount();

  const mgmt = org.MasterAccountId;
  const sel = Object.values(selected);
  const ous = sel.filter((s) => s.kind === "ou");
  const accounts = sel.filter((s) => s.kind === "account");
  const createParent: SelItem | null =
    sel.length === 0 ? { kind: "root", id: root.Id, name: root.Name } : sel.length === 1 && sel[0].kind !== "account" ? sel[0] : null;
  const single = sel.length === 1 ? sel[0] : null;
  const singleMember = single && single.kind === "account" && single.id !== mgmt ? single : null;

  const toggle = (item: SelItem) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });

  const done = (message: string) => {
    showToast("success", message);
    setSelected({});
    setDialog(null);
  };

  const actions: ButtonDropdownProps.ItemOrGroup[] = [
    {
      text: "Organizational unit",
      items: [
        { id: "create-ou", text: "Create new", disabled: !createParent },
        { id: "rename-ou", text: "Rename", disabled: !(single && single.kind === "ou") },
        { id: "delete-ou", text: "Delete", disabled: !(ous.length > 0 && ous.length === sel.length) },
      ],
    },
    {
      text: "AWS account",
      items: [
        { id: "move", text: "Move", disabled: !(accounts.length > 0 && accounts.length === sel.length) },
        { id: "remove", text: "Remove from organization", disabled: !singleMember },
        { id: "close", text: "Close account", disabled: !singleMember },
        { id: "export", text: "Export account list" },
      ],
    },
  ];

  const onAction = (id: string) => {
    if (id === "export") {
      downloadText("aws-accounts.csv", accountsCsv(allAccounts.data?.accounts ?? []));
      return;
    }
    setOuName(id === "rename-ou" ? single!.name : "");
    setOuTags([]);
    setDestination(null);
    setDialog(id as Dialog);
  };

  async function handleCreateOU() {
    try {
      await createOU.mutateAsync({ parentId: createParent!.id, name: ouName.trim(), tags: tagsToRecord(ouTags) });
      done(`Successfully created organizational unit '${ouName.trim()}'.`);
    } catch (e) {
      showToast("error", errorText(e, "Failed to create organizational unit"));
    }
  }

  async function handleRenameOU() {
    try {
      await updateOU.mutateAsync({ id: single!.id, name: ouName.trim() });
      done(`Successfully renamed organizational unit to '${ouName.trim()}'.`);
    } catch (e) {
      showToast("error", errorText(e, "Failed to rename organizational unit"));
    }
  }

  async function handleDeleteOU() {
    try {
      for (const ou of ous) await deleteOU.mutateAsync(ou.id);
      done(ous.length === 1 ? `Successfully deleted organizational unit '${ous[0].name}'.` : `Successfully deleted ${ous.length} organizational units.`);
    } catch (e) {
      showToast("error", errorText(e, "Failed to delete organizational unit"));
    }
  }

  async function sourceParent(item: SelItem): Promise<string> {
    if (item.parentId) return item.parentId;
    const res = await api<{ parents: { Id: string }[] }>(`/aws/organizations/parents?childId=${item.id}`);
    return res.parents[0].Id;
  }

  async function handleMove() {
    try {
      for (const a of accounts) {
        await moveAccount.mutateAsync({ accountId: a.id, sourceParentId: await sourceParent(a), destinationParentId: destination!.id });
      }
      done(
        accounts.length === 1
          ? `Successfully moved the AWS account '${accounts[0].name}' to '${destination!.name}'.`
          : `Successfully moved ${accounts.length} AWS accounts to '${destination!.name}'.`,
      );
    } catch (e) {
      showToast("error", errorText(e, "Failed to move account"));
    }
  }

  async function handleRemove() {
    try {
      await removeAccount.mutateAsync(singleMember!.id);
      done(`Successfully removed the AWS account '${singleMember!.name}' from the organization.`);
    } catch (e) {
      showToast("error", errorText(e, "Failed to remove account"));
    }
  }

  async function handleClose() {
    try {
      await closeAccount.mutateAsync(singleMember!.id);
      done(`Closing the AWS account '${singleMember!.name}'.`);
    } catch (e) {
      showToast("error", errorText(e, "Failed to close account"));
    }
  }

  const rowSel = { selected, onToggle: toggle, managementAccountId: mgmt };
  const lower = term.toLowerCase();
  const flatAccounts = (allAccounts.data?.accounts ?? []).filter(
    (a) => !lower || [a.Name, a.Email, a.Id].some((v) => v.toLowerCase().includes(lower)),
  );
  const showFlat = mode === "list" || !!term;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={<Button variant="primary" onClick={onAddAccount}>Add an AWS account</Button>}
        description="The accounts listed below are members of your organization. The organization's management account is responsible for paying the bills for all accounts in the organization."
      >
        AWS accounts
      </Header>
      <Container
        disableContentPaddings
        header={
          <Header
            variant="h2"
            description="Organizational units (OUs) enable you to group several accounts together and administer them as a single unit instead of one at a time."
            actions={
              <ButtonDropdown items={actions} onItemClick={({ detail }) => onAction(detail.id)}>
                Actions
              </ButtonDropdown>
            }
          >
            Organization
          </Header>
        }
      >
        <div className="fd-org-toolbar">
          <div className="fd-org-search">
            <TextFilter
              filteringText={search}
              filteringPlaceholder="Find AWS accounts by name, email, or account ID. Find an OU by the exact OU ID."
              filteringAriaLabel="Find AWS accounts"
              onChange={({ detail }) => setSearch(detail.filteringText)}
            />
          </div>
          <SegmentedControl
            selectedId={mode}
            label="View"
            onChange={({ detail }) => setMode(detail.selectedId as "hierarchy" | "list")}
            options={[
              { id: "hierarchy", text: "Hierarchy", iconName: "view-horizontal" },
              { id: "list", text: "List", iconName: "view-full" },
            ]}
          />
        </div>
        <div className="fd-org-tree" role="grid" aria-label="Organizational structure">
          <div className="fd-org-row fd-org-row--head" role="row">
            <div className="fd-org-cell" role="columnheader">{showFlat ? "AWS account" : "Organizational structure"}</div>
            <div className="fd-org-date" role="columnheader">Account created/joined date</div>
          </div>
          {!showFlat && <ContainerNode kind="root" id={root.Id} name={root.Name} depth={0} defaultExpanded {...rowSel} />}
          {showFlat && searchedOU.data && (
            <ContainerNode kind="ou" id={searchedOU.data.Id} name={searchedOU.data.Name} depth={0} {...rowSel} />
          )}
          {showFlat && flatAccounts.map((a) => <AccountRow key={a.Id} account={a} depth={0} {...rowSel} />)}
          {showFlat && flatAccounts.length === 0 && !searchedOU.data && (
            <Box textAlign="center" padding="l" color="text-body-secondary">
              {term ? "No matching AWS accounts." : "No AWS accounts."}
            </Box>
          )}
        </div>
      </Container>

      <Modal
        visible={dialog === "create-ou" || dialog === "rename-ou"}
        onDismiss={() => setDialog(null)}
        header={dialog === "rename-ou" ? "Rename organizational unit" : "Create organizational unit"}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDialog(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!ouName.trim()}
                loading={createOU.isPending || updateOU.isPending}
                onClick={dialog === "rename-ou" ? handleRenameOU : handleCreateOU}
              >
                {dialog === "rename-ou" ? "Save changes" : "Create organizational unit"}
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {dialog === "create-ou" && (
            <Box variant="p">
              The new OU is created in <b>{createParent?.name}</b>.
            </Box>
          )}
          <FormField label="Organizational unit name" constraintText="OU names must be unique within the parent.">
            <Input value={ouName} onChange={({ detail }) => setOuName(detail.value)} ariaLabel="Organizational unit name" />
          </FormField>
          {dialog === "create-ou" && (
            <FormField label="Tags - optional">
              <TagsEditor tags={ouTags} onChange={setOuTags} />
            </FormField>
          )}
        </SpaceBetween>
      </Modal>

      <TypedConfirmModal
        visible={dialog === "delete-ou"}
        header={ous.length === 1 ? `Delete organizational unit '${ous[0].name}'?` : `Delete ${ous.length} organizational units?`}
        confirmValue={ous.length === 1 ? ous[0].name : "delete"}
        confirmLabel="Delete"
        loading={deleteOU.isPending}
        onConfirm={handleDeleteOU}
        onDismiss={() => setDialog(null)}
      >
        An OU can be deleted only after all accounts and child OUs have been moved out of it.
      </TypedConfirmModal>

      <Modal
        visible={dialog === "move"}
        onDismiss={() => setDialog(null)}
        header="Move AWS account"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDialog(null)}>Cancel</Button>
              <Button variant="primary" disabled={!destination} loading={moveAccount.isPending} onClick={handleMove}>
                Move AWS account
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="p">
            Choose the root or OU to move <b>{accounts.map((a) => a.name).join(", ")}</b> to.
          </Box>
          {dialog === "move" && (
            <DestinationPicker rootId={root.Id} rootName={root.Name} value={destination?.id ?? null} onChange={(id, name) => setDestination({ id, name })} />
          )}
        </SpaceBetween>
      </Modal>

      <Modal
        visible={dialog === "remove"}
        onDismiss={() => setDialog(null)}
        header={`Remove account '${singleMember?.name}' (#${singleMember?.id}) from organization?`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDialog(null)}>Cancel</Button>
              <Button variant="primary" loading={removeAccount.isPending} onClick={handleRemove}>Remove account</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box variant="p">The account becomes a standalone account and is no longer affected by the organization's policies.</Box>
      </Modal>

      <TypedConfirmModal
        visible={dialog === "close"}
        header={`Close account '${singleMember?.name}'?`}
        confirmValue={singleMember?.id ?? ""}
        confirmLabel="Close account"
        loading={closeAccount.isPending}
        onConfirm={handleClose}
        onDismiss={() => setDialog(null)}
      >
        The account is suspended and shows a CLOSED label until it is permanently closed.
      </TypedConfirmModal>
    </SpaceBetween>
  );
}
