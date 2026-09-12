import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import {
  useRe2Indexes,
  useRe2IndexDetail,
  useRe2CreateIndex,
  useRe2DeleteIndex,
  useRe2UpdateIndexType,
  useRe2ServiceConfig,
  useRe2Views,
  useRe2ViewDetail,
  useRe2CreateView,
  useRe2UpdateView,
  useRe2DeleteView,
  useRe2DefaultView,
  useRe2AssociateDefaultView,
  useRe2DisassociateDefaultView,
  useRe2Search,
  useRe2ResourceTypes,
} from "../../hooks/useResourceExplorer2";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function IndexesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useRe2Indexes();
  const { data: detail } = useRe2IndexDetail();
  const { data: config } = useRe2ServiceConfig();
  const create = useRe2CreateIndex();
  const remove = useRe2DeleteIndex();
  const switchType = useRe2UpdateIndexType();

  const [showCreate, setShowCreate] = useState(false);
  const [tagsText, setTagsText] = useState("");

  const indexes: any[] = data?.indexes || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({ tags: tagsText.trim() ? tagsText : undefined });
      setShowCreate(false);
      setTagsText("");
      showToast("success", "Index created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create index");
    }
  };

  const doDelete = async (arn: string) => {
    try {
      await remove.mutateAsync(arn);
      showToast("success", "Index deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete index");
    }
  };

  const doSwitch = async (idx: any) => {
    try {
      const target = idx.type === "LOCAL" ? "AGGREGATOR" : "LOCAL";
      await switchType.mutateAsync({ arn: idx.arn, type: target });
      showToast("success", `Index switched to ${target}`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update index type");
    }
  };

  const indexState = detail?.index?.State || null;

  return (
    <>
      <SpaceBetween size="s">
        <SpaceBetween size="xxs">
          <Box>Account-level service access: {config?.OrgConfiguration?.AWSServiceAccessStatus || "—"}</Box>
          <Box>Region index state: {indexState || "—"}</Box>
        </SpaceBetween>
        <ResourceTable
          resourceName="index"
          loading={isLoading}
          items={indexes}
          onCreate={() => setShowCreate(true)}
          columns={[
            { id: "arn", header: "ARN", cell: (i: any) => i.arn || "—" },
            { id: "region", header: "Region", cell: (i: any) => i.region || "—" },
            { id: "type", header: "Type", cell: (i: any) => i.type || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (i: any) => (
                <SpaceBetween size="xxs" direction="horizontal">
                  <Button
                    ariaLabel={`Switch type ${i.arn}`}
                    onClick={() => doSwitch(i)}
                  >
                    Switch to {i.type === "LOCAL" ? "AGGREGATOR" : "LOCAL"}
                  </Button>
                  <DeleteButton itemName={i.arn} resourceType="index" onDelete={() => doDelete(i.arn)} />
                </SpaceBetween>
              ),
            },
          ]}
        />
      </SpaceBetween>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create index"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} loading={create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Tags (JSON object, optional)">
          <Textarea
            value={tagsText}
            onChange={({ detail }) => setTagsText(detail.value)}
            rows={4}
            placeholder='{"env": "dev"}'
          />
        </FormField>
      </Modal>
    </>
  );
}

function ViewsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useRe2Views();
  const { data: defaultView } = useRe2DefaultView();
  const create = useRe2CreateView();
  const update = useRe2UpdateView();
  const remove = useRe2DeleteView();
  const associate = useRe2AssociateDefaultView();
  const disassociate = useRe2DisassociateDefaultView();

  const [showCreate, setShowCreate] = useState(false);
  const [viewName, setViewName] = useState("");
  const [filters, setFilters] = useState("");
  const [includedProperties, setIncludedProperties] = useState("");
  const [scope, setScope] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editFilters, setEditFilters] = useState("");
  const [editProps, setEditProps] = useState("");
  const { data: detail } = useRe2ViewDetail(editing?.arn ?? null);

  const views: any[] = data?.views || [];
  const defaultArn: string | null = defaultView?.viewArn || null;

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        viewName: viewName.trim(),
        filters: filters.trim() || undefined,
        includedProperties: includedProperties.trim() || undefined,
        scope: scope.trim() || undefined,
      });
      setShowCreate(false);
      setViewName("");
      setFilters("");
      setIncludedProperties("");
      setScope("");
      showToast("success", "View created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create view");
    }
  };

  const doUpdate = async () => {
    try {
      await update.mutateAsync({
        viewArn: editing.arn,
        filters: editFilters.trim() || undefined,
        includedProperties: editProps.trim() || undefined,
      });
      setEditing(null);
      showToast("success", "View updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update view");
    }
  };

  const doAssociate = async (arn: string) => {
    try {
      await associate.mutateAsync(arn);
      showToast("success", "View associated as default");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to associate default view");
    }
  };

  const doDisassociate = async () => {
    try {
      await disassociate.mutateAsync();
      showToast("success", "Default view disassociated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to disassociate default view");
    }
  };

  const doDelete = async (arn: string) => {
    try {
      await remove.mutateAsync(arn);
      showToast("success", "View deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete view");
    }
  };

  return (
    <>
      <SpaceBetween size="s">
        <SpaceBetween size="xxs" direction="horizontal">
          <Box>Default view: {defaultArn || "none"}</Box>
          <Button onClick={() => doDisassociate()} disabled={!defaultArn}>
            Disassociate default
          </Button>
        </SpaceBetween>
        <ResourceTable
          resourceName="view"
          loading={isLoading}
          items={views}
          onCreate={() => setShowCreate(true)}
          columns={[
            { id: "arn", header: "ARN", cell: (v: any) => v.arn || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (v: any) => (
                <SpaceBetween size="xxs" direction="horizontal">
                  <Button
                    ariaLabel={`Update ${v.arn}`}
                    onClick={() => {
                      setEditing(v);
                      setEditFilters("");
                      setEditProps("");
                    }}
                  >
                    Update
                  </Button>
                  <Button ariaLabel={`Make default ${v.arn}`} onClick={() => doAssociate(v.arn)}>
                    Make default
                  </Button>
                  <DeleteButton itemName={v.arn} resourceType="view" onDelete={() => doDelete(v.arn)} />
                </SpaceBetween>
              ),
            },
          ]}
        />
      </SpaceBetween>
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create view"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!viewName.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="View name">
            <Input value={viewName} onChange={({ detail }) => setViewName(detail.value)} placeholder="my-view" />
          </FormField>
          <FormField label="Filter string (optional)">
            <Input value={filters} onChange={({ detail }) => setFilters(detail.value)} placeholder="service eq s3" />
          </FormField>
          <FormField label="Included properties (comma-separated, optional)">
            <Input value={includedProperties} onChange={({ detail }) => setIncludedProperties(detail.value)} placeholder="tags" />
          </FormField>
          <FormField label="Scope ARN (optional)">
            <Input value={scope} onChange={({ detail }) => setScope(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!editing}
        onDismiss={() => setEditing(null)}
        header="Update view"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={doUpdate} loading={update.isPending}>Save</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Filter string (optional)">
            <Input value={editFilters} onChange={({ detail }) => setEditFilters(detail.value)} />
          </FormField>
          <FormField label="Included properties (comma-separated, optional)">
            <Input value={editProps} onChange={({ detail }) => setEditProps(detail.value)} />
          </FormField>
          {detail?.view ? (
            <FormField label="Current definition">
              <Box>
                <pre>{JSON.stringify(detail.view, null, 2)}</pre>
              </Box>
            </FormField>
          ) : null}
        </SpaceBetween>
      </Modal>
    </>
  );
}

function SearchTab() {
  const search = useRe2Search();
  const { data: typesData, isLoading: typesLoading } = useRe2ResourceTypes();

  const [query, setQuery] = useState("");
  const [viewArn, setViewArn] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  const types: any[] = typesData?.types || [];

  const doSearch = async () => {
    try {
      const res = await search.mutateAsync({
        queryString: query.trim(),
        viewArn: viewArn.trim() || undefined,
      });
      setResults(res.resources);
    } catch {
      setResults([]);
    }
  };

  return (
    <SpaceBetween size="m">
      <SpaceBetween size="xs">
        <FormField label="Search query">
          <Input value={query} onChange={({ detail }) => setQuery(detail.value)} placeholder="service:s3" />
        </FormField>
        <FormField label="View ARN (optional)">
          <Input value={viewArn} onChange={({ detail }) => setViewArn(detail.value)} />
        </FormField>
        <Button variant="primary" onClick={doSearch} disabled={!query.trim()} loading={search.isPending}>
          Search
        </Button>
      </SpaceBetween>
      {results ? (
        <ResourceTable
          resourceName="resource"
          items={results}
          columns={[
            { id: "arn", header: "ARN", cell: (r: any) => r.arn || "—" },
            { id: "type", header: "Type", cell: (r: any) => r.resourceType || "—" },
            { id: "region", header: "Region", cell: (r: any) => r.region || "—" },
            { id: "service", header: "Service", cell: (r: any) => r.service || "—" },
          ]}
        />
      ) : (
        <Box>Enter a query to search indexed resources.</Box>
      )}
      <ResourceTable
        resourceName="resource type"
        loading={typesLoading}
        items={types}
        columns={[
          { id: "resourceType", header: "Resource type", cell: (t: any) => t.resourceType || "—" },
          { id: "service", header: "Service", cell: (t: any) => t.service || "—" },
        ]}
      />
    </SpaceBetween>
  );
}

export default function ResourceExplorer2Dashboard() {
  return (
    <Tabs
      tabs={[
        { id: "indexes", label: "Indexes", content: <IndexesTab /> },
        { id: "views", label: "Views", content: <ViewsTab /> },
        { id: "search", label: "Search", content: <SearchTab /> },
      ]}
    />
  );
}
