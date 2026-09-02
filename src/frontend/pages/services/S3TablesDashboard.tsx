import { useState } from "react";
import {
  Box,
  SpaceBetween,
  Modal,
  Form,
  FormField,
  Input,
  Button,
  Header,
} from "@cloudscape-design/components";
import {
  useS3TableBuckets,
  useCreateS3TableBucket,
  useDeleteS3TableBucket,
  useS3TableNamespaces,
  useCreateS3TableNamespace,
  useDeleteS3TableNamespace,
  useS3Tables,
  useCreateS3Table,
  useDeleteS3Table,
} from "../../hooks/useS3Tables";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function S3TablesDashboard() {
  const { data, isLoading } = useS3TableBuckets();
  const createBucket = useCreateS3TableBucket();
  const deleteBucket = useDeleteS3TableBucket();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const { data: nsData, isLoading: nsLoading } = useS3TableNamespaces(selectedBucket);
  const createNamespace = useCreateS3TableNamespace(selectedBucket);
  const deleteNamespace = useDeleteS3TableNamespace(selectedBucket);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const { data: tblData, isLoading: tblLoading } = useS3Tables(selectedBucket, selectedNamespace);
  const createTable = useCreateS3Table(selectedBucket, selectedNamespace);
  const deleteTable = useDeleteS3Table(selectedBucket, selectedNamespace);

  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [bucketName, setBucketName] = useState("");
  const [showCreateNamespace, setShowCreateNamespace] = useState(false);
  const [namespaceName, setNamespaceName] = useState("");
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [tableName, setTableName] = useState("");
  const [tableFormat, setTableFormat] = useState("ICEBERG");

  const handleCreateBucket = async () => {
    if (!bucketName) return;
    try {
      await createBucket.mutateAsync(bucketName);
      setShowCreateBucket(false);
      setBucketName("");
    } catch {}
  };

  const handleCreateNamespace = async () => {
    if (!namespaceName || !selectedBucket) return;
    try {
      await createNamespace.mutateAsync(namespaceName);
      setShowCreateNamespace(false);
      setNamespaceName("");
    } catch {}
  };

  const handleCreateTable = async () => {
    if (!tableName || !tableFormat || !selectedNamespace) return;
    try {
      await createTable.mutateAsync({ name: tableName, format: tableFormat });
      setShowCreateTable(false);
      setTableName("");
      setTableFormat("ICEBERG");
    } catch {}
  };

  const buckets = (data as any)?.buckets || [];
  const namespaces = (nsData as any)?.namespaces || [];
  const tables = (tblData as any)?.tables || [];
  const nsName = (n: any) =>
    typeof n === "string" ? n : (n.namespace?.at(-1)?.name ?? n.namespace?.join(".") ?? "—");

  return (
    <SpaceBetween size="l">
      <ResourceTable
        resourceName="Table bucket"
        headerTitle="S3 Table Buckets"
        headerCounter={(data as any)?.total}
        items={buckets.map((b: any) => ({
          id: b.arn ?? b.name,
          name: b.name,
          createdAt: b.createdAt || "—",
        }))}
        loading={isLoading}
        emptyMessage="No S3 table buckets"
        columns={[
          {
            id: "name",
            header: "Name",
            cell: (item: any) => (
              <Button
                variant="link"
                onClick={() => {
                  const next = item.id === selectedBucket ? null : item.id;
                  setSelectedBucket(next);
                  setSelectedNamespace(null);
                }}
              >
                {item.name}
              </Button>
            ),
          },
          { id: "created", header: "Created", cell: (item: any) => item.createdAt },
          {
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.name}
                resourceType="table bucket"
                loading={deleteBucket.isPending}
                onDelete={async () => {
                  try {
                    await deleteBucket.mutateAsync(item.id);
                    if (selectedBucket === item.id) {
                      setSelectedBucket(null);
                      setSelectedNamespace(null);
                    }
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find buckets by name"
        filterFunction={(i: any, s: string) =>
          (i.name ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreateBucket(true)}
      />

      {selectedBucket && (
        <Box>
          <Header variant="h3">Namespaces</Header>
          <ResourceTable
            resourceName="Namespace"
            headerTitle=""
            headerCounter={(nsData as any)?.total}
            items={namespaces.map((n: any, i: number) => ({
              id: `${nsName(n)}-${i}`,
              name: nsName(n),
            }))}
            loading={nsLoading}
            emptyMessage="No namespaces"
            columns={[
              {
                id: "name",
                header: "Namespace",
                cell: (item: any) => (
                  <Button
                    variant="link"
                    onClick={() =>
                      setSelectedNamespace(item.name === selectedNamespace ? null : item.name)
                    }
                  >
                    {item.name}
                  </Button>
                ),
              },
              {
                id: "actions",
                header: "",
                cell: (item: any) => (
                  <DeleteButton
                    itemName={item.name}
                    resourceType="namespace"
                    loading={deleteNamespace.isPending}
                    onDelete={async () => {
                      try {
                        await deleteNamespace.mutateAsync(item.name);
                        if (selectedNamespace === item.name) setSelectedNamespace(null);
                      } catch {}
                    }}
                  />
                ),
              },
            ]}
            filterEnabled
            filterPlaceholder="Find namespaces"
            filterFunction={(i: any, s: string) =>
              (i.name ?? "").toLowerCase().includes(s.toLowerCase())
            }
            onCreate={() => setShowCreateNamespace(true)}
          />
        </Box>
      )}

      {selectedBucket && selectedNamespace && (
        <Box>
          <Header variant="h3">
            Tables — {selectedNamespace}
          </Header>
          <ResourceTable
            resourceName="Table"
            headerTitle=""
            headerCounter={(tblData as any)?.total}
            items={tables.map((t: any) => ({
              id: t.name ?? "",
              type: t.type || "—",
              createdAt: t.createdAt || "—",
            }))}
            loading={tblLoading}
            emptyMessage="No tables"
            columns={[
              {
                id: "name",
                header: "Name",
                cell: (item: any) => <Box>{item.id}</Box>,
              },
              { id: "type", header: "Type", cell: (item: any) => item.type },
              { id: "created", header: "Created", cell: (item: any) => item.createdAt },
              {
                id: "actions",
                header: "",
                cell: (item: any) => (
                  <DeleteButton
                    itemName={item.id}
                    resourceType="table"
                    loading={deleteTable.isPending}
                    onDelete={async () => {
                      try {
                        await deleteTable.mutateAsync(item.id);
                      } catch {}
                    }}
                  />
                ),
              },
            ]}
            filterEnabled
            filterPlaceholder="Find tables"
            filterFunction={(i: any, s: string) =>
              (i.id ?? "").toLowerCase().includes(s.toLowerCase())
            }
            onCreate={() => setShowCreateTable(true)}
          />
        </Box>
      )}

      <Modal visible={showCreateBucket} onDismiss={() => setShowCreateBucket(false)} header="Create Table Bucket">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Bucket name">
              <Input value={bucketName} onChange={(e) => setBucketName(e.detail.value)} />
            </FormField>
            <Button onClick={handleCreateBucket} disabled={!bucketName || createBucket.isPending}>
              Create bucket
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showCreateNamespace} onDismiss={() => setShowCreateNamespace(false)} header="Create Namespace">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Namespace">
              <Input value={namespaceName} onChange={(e) => setNamespaceName(e.detail.value)} />
            </FormField>
            <Button
              onClick={handleCreateNamespace}
              disabled={!namespaceName || createNamespace.isPending}
            >
              Create namespace
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showCreateTable} onDismiss={() => setShowCreateTable(false)} header="Create Table">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Table name">
              <Input value={tableName} onChange={(e) => setTableName(e.detail.value)} />
            </FormField>
            <FormField label="Format">
              <Input value={tableFormat} onChange={(e) => setTableFormat(e.detail.value.toUpperCase())} />
            </FormField>
            <Button
              onClick={handleCreateTable}
              disabled={!tableName || !tableFormat || createTable.isPending}
            >
              Create table
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
