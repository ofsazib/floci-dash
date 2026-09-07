import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  Select,
  SpaceBetween,
  StatusIndicator,
} from "@cloudscape-design/components";
import {
  useRepositoryAssociations,
  useAssociateRepository,
  useDisassociateRepository,
  useCodeGuruTags,
  useCodeGuruTagResource,
  useCodeGuruUntagResource,
} from "../../hooks/useCodeGuruReviewer";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { useToast } from "../../components/Toast";

const PROVIDER_OPTIONS = [
  { label: "GitHub", value: "GitHub" },
  { label: "Bitbucket", value: "Bitbucket" },
  { label: "GitHub Enterprise Server", value: "GitHubEnterpriseServer" },
  { label: "S3 Bucket", value: "S3Bucket" },
  { label: "AWS CodeCommit", value: "CodeCommit" },
];

function stateIndicator(state: string | undefined) {
  const s = state || "UNKNOWN";
  const color =
    s === "Associated" ? "success" : s === "Associating" || s === "Disassociating" ? "in-progress" : "error";
  return <StatusIndicator type={color as any}>{s}</StatusIndicator>;
}

/** Tag editor for an association ARN. */
function TagsEditor({ arn }: { arn: string }) {
  const { showToast } = useToast();
  const { data, isLoading } = useCodeGuruTags(arn);
  const tagResource = useCodeGuruTagResource();
  const untagResource = useCodeGuruUntagResource();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const tags: Record<string, string> = data?.tags || {};
  const entries = Object.entries(tags);

  const add = async () => {
    try {
      await tagResource.mutateAsync({ resourceArn: arn, tags: { [key.trim()]: value } });
      showToast("success", `Tag ${key.trim()} added`);
      setKey("");
      setValue("");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to add tag");
    }
  };

  const remove = async (k: string) => {
    try {
      await untagResource.mutateAsync({ resourceArn: arn, tagKeys: [k] });
      showToast("success", `Tag ${k} removed`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to remove tag");
    }
  };

  if (isLoading) return <Box color="text-body-secondary">Loading tags…</Box>;

  return (
    <SpaceBetween size="m">
      <SpaceBetween direction="horizontal" size="xs">
        <FormField label="Tag key">
          <Input value={key} onChange={(e) => setKey(e.detail.value)} placeholder="env" />
        </FormField>
        <FormField label="Tag value">
          <Input value={value} onChange={(e) => setValue(e.detail.value)} placeholder="prod" />
        </FormField>
        <Box padding={{ top: "xl" }}>
          <Button onClick={add} disabled={!key.trim() || tagResource.isPending}>
            Add tag
          </Button>
        </Box>
      </SpaceBetween>
      {entries.length === 0 ? (
        <Box color="text-body-secondary">No tags on this association.</Box>
      ) : (
        entries.map(([k, v]) => (
          <SpaceBetween key={k} direction="horizontal" size="xs">
            <Box>
              <b>{k}</b>: {v}
            </Box>
            <Button
              variant="link"
              onClick={() => remove(k)}
              loading={untagResource.isPending && untagResource.variables?.tagKeys?.[0] === k}
            >
              Remove
            </Button>
          </SpaceBetween>
        ))
      )}
    </SpaceBetween>
  );
}

export function CodeGuruReviewerDashboard() {
  const { showToast } = useToast();
  const { data, isLoading } = useRepositoryAssociations();
  const associateRepo = useAssociateRepository();
  const disassociateRepo = useDisassociateRepository();

  const [showCreate, setShowCreate] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoOwner, setRepoOwner] = useState("");
  const [provider, setProvider] = useState(PROVIDER_OPTIONS[0]);
  const [createError, setCreateError] = useState<string | null>(null);

  const [tagsTarget, setTagsTarget] = useState<any>(null);

  const associations: any[] = data?.associations || [];

  const closeCreate = () => {
    setShowCreate(false);
    setRepoName("");
    setRepoOwner("");
    setProvider(PROVIDER_OPTIONS[0]);
    setCreateError(null);
  };

  const submitCreate = async () => {
    const repository: Record<string, any> =
      provider.value === "S3Bucket"
        ? { S3Bucket: { Name: repoName.trim() } }
        : provider.value === "CodeCommit"
          ? { CodeCommit: { Name: repoName.trim() } }
          : { [provider.value]: { Name: repoName.trim(), Owner: repoOwner.trim() || undefined } };
    try {
      await associateRepo.mutateAsync({ Repository: repository });
      showToast("success", `Repository ${repoName.trim()} associated`);
      closeCreate();
    } catch (e: any) {
      setCreateError(e?.message || "Failed to associate repository");
    }
  };

  const handleDelete = async (assoc: any) => {
    try {
      await disassociateRepo.mutateAsync(assoc.arn);
      showToast("success", `Repository ${assoc.name} disassociated`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to disassociate repository");
    }
  };

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h2">CodeGuru Reviewer</Header>
        <Box color="text-body-secondary">
          Associate repositories for automated code reviews backed by the Floci emulator.
        </Box>
      </Box>

      <ResourceTable
        resourceName="Repository association"
        headerTitle="Repository associations"
        headerCounter={data?.total}
        items={associations.map((a) => ({
          id: a.AssociationArn,
          name: a.Name,
          arn: a.AssociationArn,
          owner: a.Owner,
          providerType: a.ProviderType,
          state: a.State,
        }))}
        loading={isLoading}
        emptyMessage="No repository associations"
        onCreate={() => {
          setRepoName("");
          setRepoOwner("");
          setProvider(PROVIDER_OPTIONS[0]);
          setCreateError(null);
          setShowCreate(true);
        }}
        columns={[
          { id: "name", header: "Repository", cell: (i: any) => i.name || "—", isRowHeader: true },
          { id: "owner", header: "Owner", cell: (i: any) => i.owner || "—" },
          { id: "providerType", header: "Provider", cell: (i: any) => i.providerType || "—" },
          { id: "state", header: "State", cell: (i: any) => stateIndicator(i.state) },
          {
            id: "actions",
            header: "",
            cell: (i: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setTagsTarget(i)}>
                  Tags
                </Button>
                <DeleteButton
                  itemName={i.name || i.arn}
                  resourceType="repository association"
                  loading={disassociateRepo.isPending && disassociateRepo.variables === i.arn}
                  onDelete={() => handleDelete(i)}
                />
              </SpaceBetween>
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find associations by name"
        filterFunction={(i: any, s: string) =>
          `${i.name ?? ""} ${i.arn}`.toLowerCase().includes(s.toLowerCase())
        }
      />

      <Modal visible={showCreate} onDismiss={closeCreate} header="Associate repository">
        <SpaceBetween size="m">
          <FormField label="Provider type">
            <Select
              selectedOption={provider}
              onChange={({ detail }: any) => setProvider(detail.selectedOption)}
              options={PROVIDER_OPTIONS}
            />
          </FormField>
          <FormField label="Repository name">
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.detail.value)}
              placeholder="my-repo"
            />
          </FormField>
          {provider.value !== "S3Bucket" && provider.value !== "CodeCommit" && (
            <FormField label="Owner (account ID or organization)">
              <Input
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.detail.value)}
                placeholder="123456789012"
              />
            </FormField>
          )}
          {createError && <Alert type="error">{createError}</Alert>}
          <Button onClick={submitCreate} disabled={!repoName.trim() || associateRepo.isPending}>
            Associate repository
          </Button>
        </SpaceBetween>
      </Modal>

      <Modal visible={!!tagsTarget} onDismiss={() => setTagsTarget(null)} header="Association tags">
        {tagsTarget && (
          <SpaceBetween size="m">
            <Box>
              Tags for <Box variant="code">{tagsTarget.arn}</Box>
            </Box>
            <TagsEditor arn={tagsTarget.arn} />
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
}
