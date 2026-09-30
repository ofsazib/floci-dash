import { useState } from "react";
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  FormField,
  Input,
  Textarea,
  Alert,
} from "@cloudscape-design/components";
import ServiceDashboardLayout from "../../components/ServiceDashboardLayout";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useRedshiftDataStatements,
  useExecuteRedshiftDataQuery,
  useDescribeRedshiftDataStatement,
  useRedshiftDataStatementResult,
  useCancelRedshiftDataStatement,
  useRedshiftDataDatabases,
  useRedshiftDataSchemas,
  useRedshiftDataTables,
  type StatementSummary,
  type StatementDetail,
  type ResultColumn,
} from "../../hooks/useRedshiftData";

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

/** Floci's field mapper emits exactly one typed key per result cell. */
function cellValue(cell: Record<string, unknown>): string {
  const value = Object.values(cell)[0];
  return value === undefined || value === null ? "—" : String(value);
}

function ConnectionBar({
  cluster,
  database,
  dbUser,
  onClusterChange,
  onDatabaseChange,
  onDbUserChange,
}: {
  cluster: string;
  database: string;
  dbUser: string;
  onClusterChange: (v: string) => void;
  onDatabaseChange: (v: string) => void;
  onDbUserChange: (v: string) => void;
}) {
  return (
    <Container header={<Header variant="h2">Connection</Header>}>
      <SpaceBetween direction="horizontal" size="m">
        <FormField label="Cluster identifier">
          <Input value={cluster} onChange={({ detail }) => onClusterChange(detail.value)} placeholder="my-cluster" />
        </FormField>
        <FormField label="Database">
          <Input value={database} onChange={({ detail }) => onDatabaseChange(detail.value)} placeholder="dev" />
        </FormField>
        <FormField label="Db user">
          <Input value={dbUser} onChange={({ detail }) => onDbUserChange(detail.value)} placeholder="admin" />
        </FormField>
      </SpaceBetween>
    </Container>
  );
}

function ConsoleTab({
  cluster,
  database,
  dbUser,
}: {
  cluster: string;
  database: string;
  dbUser: string;
}) {
  const [sql, setSql] = useState("");
  const execute = useExecuteRedshiftDataQuery();
  const [status, setStatus] = useState<Status | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const describe = useDescribeRedshiftDataStatement(statementId);
  const result = useRedshiftDataStatementResult(statementId);

  async function handleRun() {
    setStatus(null);
    try {
      const res = await execute.mutateAsync({ clusterIdentifier: cluster, database, dbUser, sql });
      setStatementId(res.id);
      setStatus({ type: "success", message: `Statement ${res.id} submitted.` });
    } catch (err) {
      setStatementId(null);
      setStatus({ type: "error", message: (err as Error)?.message || "Failed to run statement" });
    }
  }

  const detail: StatementDetail | undefined = describe.data;
  const columns: ResultColumn[] = result.data?.columns || [];

  return (
    <SpaceBetween size="m">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <FormField label="SQL">
        <Textarea
          value={sql}
          onChange={({ detail }) => setSql(detail.value)}
          placeholder="SELECT 1"
          rows={4}
        />
      </FormField>
      <Box float="right">
        <Button
          variant="primary"
          disabled={!sql || !cluster || !database || !dbUser}
          loading={execute.isPending}
          onClick={handleRun}
        >
          Run
        </Button>
      </Box>
      {detail && (
        <Container header={<Header variant="h3">Statement {detail.id}</Header>}>
          <SpaceBetween size="xs">
            <Box variant="p">
              Status: {detail.status} — rows: {detail.resultRows}
            </Box>
            {detail.error && (
              <Alert type="error">{detail.error}</Alert>
            )}
          </SpaceBetween>
        </Container>
      )}
      {detail?.hasResultSet && columns.length > 0 && (
        <ResourceTable
          resourceName="row"
          headerTitle="Results"
          items={(result.data?.records || []).map((record, i) => ({
            rowId: i,
            cells: record.map(cellValue),
          }))}
          columns={columns.map((col, i) => ({
            id: col.name || `col-${i}`,
            header: col.name,
            cell: (row: any) => row.cells[i],
          }))}
        />
      )}
      {detail && !detail.hasResultSet && (
        <Box variant="p">Statement finished with no result set.</Box>
      )}
    </SpaceBetween>
  );
}

function CatalogTab({
  cluster,
  database,
  dbUser,
}: {
  cluster: string;
  database: string;
  dbUser: string;
}) {
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const databases = useRedshiftDataDatabases(cluster || null, dbUser || null);
  const schemas = useRedshiftDataSchemas(cluster || null, selectedDatabase, dbUser || null);
  const tables = useRedshiftDataTables(
    cluster || null,
    selectedDatabase,
    selectedSchema,
    dbUser || null
  );

  if (!cluster || !dbUser) {
    return <Box variant="p">Enter a cluster identifier to browse the catalog.</Box>;
  }

  return (
    <SpaceBetween size="m">
      <Container header={<Header variant="h3">Databases</Header>}>
        <ResourceTable
          resourceName="database"
          headerTitle="Databases"
          items={(databases.data?.databases || []).map((name) => ({ name }))}
          loading={databases.isLoading}
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (d: any) => (
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedDatabase(d.name);
                    setSelectedSchema(null);
                  }}
                >
                  {d.name}
                </Button>
              ),
            },
          ]}
        />
      </Container>
      {selectedDatabase && (
        <Container header={<Header variant="h3">Schemas in {selectedDatabase}</Header>}>
          <ResourceTable
            resourceName="schema"
            headerTitle="Schemas"
            items={(schemas.data?.schemas || []).map((name) => ({ name }))}
            loading={schemas.isLoading}
            columns={[
              {
                id: "name",
                header: "Name",
                cell: (s: any) => (
                  <Button variant="link" onClick={() => setSelectedSchema(s.name)}>
                    {s.name}
                  </Button>
                ),
              },
            ]}
          />
        </Container>
      )}
      {selectedSchema && (
        <Container header={<Header variant="h3">Tables in {selectedSchema}</Header>}>
          <ResourceTable
            resourceName="table"
            headerTitle="Tables"
            items={tables.data?.tables || []}
            loading={tables.isLoading}
            columns={[
              { id: "name", header: "Name", cell: (t: any) => t.name },
              { id: "type", header: "Type", cell: (t: any) => t.type },
            ]}
          />
        </Container>
      )}
    </SpaceBetween>
  );
}

function StatementsTab() {
  const statements = useRedshiftDataStatements();
  const cancel = useCancelRedshiftDataStatement();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const describe = useDescribeRedshiftDataStatement(selectedId);
  const result = useRedshiftDataStatementResult(selectedId);
  const detail: StatementDetail | undefined = describe.data;
  const columns: ResultColumn[] = result.data?.columns || [];

  return (
    <SpaceBetween size="m">
      <ResourceTable
        resourceName="statement"
        headerTitle="Statements"
        items={statements.data?.statements || []}
        loading={statements.isLoading}
        onRefresh={statements.refetch}
        columns={[
          { id: "id", header: "ID", cell: (s: StatementSummary) => s.Id },
          { id: "status", header: "Status", cell: (s: StatementSummary) => s.Status },
          { id: "sql", header: "Query", cell: (s: StatementSummary) => s.QueryString ?? s.Query },
          {
            id: "actions",
            header: "",
            cell: (s: StatementSummary) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setSelectedId(s.Id!)}>View</Button>
                {s.Status === "SUBMITTED" || s.Status === "STARTED" ? (
                  <DeleteButton
                    itemName={s.Id!}
                    resourceType="statement"
                    loading={cancel.isPending}
                    onDelete={() => cancel.mutateAsync(s.Id!)}
                  />
                ) : null}
              </SpaceBetween>
            ),
          },
        ]}
      />
      {detail && (
        <Container header={<Header variant="h3">Statement {detail.id}</Header>}>
          <SpaceBetween size="xs">
            <Box variant="p">
              Status: {detail.status} — rows: {detail.resultRows} — database: {detail.database}
            </Box>
            {detail.error && <Alert type="error">{detail.error}</Alert>}
            {detail.hasResultSet && columns.length > 0 && (
              <ResourceTable
                resourceName="row"
                headerTitle="Results"
                items={(result.data?.records || []).map((record, i) => ({
                  rowId: i,
                  cells: record.map(cellValue),
                }))}
                columns={columns.map((col, i) => ({
                  id: col.name || `col-${i}`,
                  header: col.name,
                  cell: (row: any) => row.cells[i],
                }))}
              />
            )}
            {detail.hasResultSet && columns.length === 0 && (
              <Box variant="p">No result columns returned.</Box>
            )}
            {!detail.hasResultSet && (
              <Box variant="p">Statement finished with no result set.</Box>
            )}
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

export default function RedshiftDataDashboard() {
  const [cluster, setCluster] = useState("");
  const [database, setDatabase] = useState("dev");
  const [dbUser, setDbUser] = useState("admin");

  return (
    <SpaceBetween size="l">
      <ConnectionBar
        cluster={cluster}
        database={database}
        dbUser={dbUser}
        onClusterChange={setCluster}
        onDatabaseChange={setDatabase}
        onDbUserChange={setDbUser}
      />
      <ServiceDashboardLayout
        tabs={[
          {
            id: "console",
            label: "Console",
            content: <ConsoleTab cluster={cluster} database={database} dbUser={dbUser} />,
          },
          {
            id: "statements",
            label: "Statements",
            content: <StatementsTab />,
          },
          {
            id: "catalog",
            label: "Catalog",
            content: <CatalogTab cluster={cluster} database={database} dbUser={dbUser} />,
          },
        ]}
      />
    </SpaceBetween>
  );
}
