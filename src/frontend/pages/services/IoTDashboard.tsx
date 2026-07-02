import { useState } from "react";
import {
  SpaceBetween,
  Box,
  Button,
  Header,
  Tabs,
  Container,
  Form,
  FormField,
  Input,
  Textarea,
  Modal,
  Alert,
  StatusIndicator,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import { TableSkeleton } from "../../components/LoadingSkeleton";
import {
  useEndpoint,
  useThings,
  useCreateThing,
  useDeleteThing,
  useThingTypes,
  useCreateThingType,
  useDeleteThingType,
  useCertificates,
  useCreateKeysAndCertificate,
  useUpdateCertificateStatus,
  useDeleteCertificate,
  usePolicies,
  useCreatePolicy,
  useDeletePolicy,
  usePolicyVersions,
  useCreatePolicyVersion,
  useTopicRules,
  useCreateTopicRule,
  useDeleteTopicRule,
  useEnableTopicRule,
  useDisableTopicRule,
  useShadow,
  useUpdateShadow,
  useThingJobs,
} from "../../hooks/useIoT";

export function IoTDashboard() {
  const thingsQuery = useThings();
  const certsQuery = useCertificates();
  const policiesQuery = usePolicies();
  const rulesQuery = useTopicRules();
  const thingTypesQuery = useThingTypes();
  const endpointQuery = useEndpoint();
  const createThing = useCreateThing();
  const deleteThing = useDeleteThing();
  const createCert = useCreateKeysAndCertificate();
  const updateCertStatus = useUpdateCertificateStatus();
  const deleteCert = useDeleteCertificate();
  const createPolicy = useCreatePolicy();
  const deletePolicy = useDeletePolicy();
  const createRule = useCreateTopicRule();
  const deleteRule = useDeleteTopicRule();
  const enableRule = useEnableTopicRule();
  const disableRule = useDisableTopicRule();
  const createThingType = useCreateThingType();
  const deleteThingType = useDeleteThingType();
  const updateShadow = useUpdateShadow();

  const [selectedThing, setSelectedThing] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  // Create modals
  const [showCreateThing, setShowCreateThing] = useState(false);
  const [newThingName, setNewThingName] = useState("");
  const [newThingType, setNewThingType] = useState("");
  const [showCreateThingType, setShowCreateThingType] = useState(false);
  const [newTTName, setNewTTName] = useState("");
  const [newTTDesc, setNewTTDesc] = useState("");
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDoc, setNewPolicyDoc] = useState("");
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleSql, setNewRuleSql] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleActions, setNewRuleActions] = useState("");

  // Shadow / detail data
  const shadowQuery = useShadow(selectedThing);
  const thingJobsQuery = useThingJobs(selectedThing);
  const policyVersionsQuery = usePolicyVersions(selectedPolicy);
  const [showShadowModal, setShowShadowModal] = useState(false);
  const [shadowState, setShadowState] = useState("");

  const things = (thingsQuery.data?.things || []).map((t: any) => ({
    thingName: t.thingName || "—",
    thingTypeName: t.thingTypeName || "—",
    thingArn: t.thingArn || "—",
  }));

  const certs = (certsQuery.data?.certificates || []).map((c: any) => ({
    certificateId: c.certificateId || "—",
    status: c.status || "—",
    creationDate: c.creationDate ? new Date(c.creationDate).toLocaleDateString() : "—",
  }));

  const policies = (policiesQuery.data?.policies || []).map((p: any) => ({
    policyName: p.policyName || "—",
    policyArn: p.policyArn || "—",
    defaultVersionId: p.defaultVersionId || "—",
    creationDate: p.creationDate ? new Date(p.creationDate).toLocaleDateString() : "—",
  }));

  const rules = (rulesQuery.data?.rules || []).map((r: any) => ({
    ruleName: r.ruleName || r.rule_name || "—",
    sql: (r.sql || r.rule_sql || "").substring(0, 80),
    description: r.description || "—",
    ruleDisabled: r.ruleDisabled ?? r.rule_disabled ?? false,
    createdDate: r.createdDate ? new Date(r.createdDate).toLocaleDateString() : "—",
  }));

  const thingTypes = (thingTypesQuery.data?.thingTypes || []).map((tt: any) => ({
    thingTypeName: tt.thingTypeName || "—",
    thingTypeArn: tt.thingTypeArn || "—",
    description: tt.thingTypeProperties?.thingTypeDescription || "—",
    creationDate: tt.creationDate ? new Date(tt.creationDate).toLocaleDateString() : "—",
  }));

  if (thingsQuery.isLoading && certsQuery.isLoading && policiesQuery.isLoading) return <TableSkeleton />;

  const thingsTab = {
    id: "things",
    label: `Things (${thingsQuery.data?.total || 0})`,
    content: (
      <SpaceBetween size="l">
        <ResourceTable
          resourceName="Thing"
          headerTitle="IoT Things"
          headerCounter={thingsQuery.data?.total}
          items={things}
          columns={[
            { id: "thingName", header: "Thing Name", cell: (i: any) => (
              <Button variant="link" onClick={() => setSelectedThing(i.thingName === selectedThing ? null : i.thingName)}>
                {i.thingName}
              </Button>
            ), isRowHeader: true },
            { id: "thingTypeName", header: "Type", cell: (i: any) => i.thingTypeName },
            { id: "thingArn", header: "ARN", cell: (i: any) => i.thingArn },
            { id: "actions", header: "", cell: (i: any) => (
              <DeleteButton
                itemName={i.thingName}
                resourceType="thing"
                loading={deleteThing.isPending && deleteThing.variables === i.thingName}
                onDelete={() => deleteThing.mutateAsync(i.thingName)}
              />
            )},
          ]}
          loading={thingsQuery.isLoading}
          emptyMessage="No IoT things. Create one to get started."
          filterEnabled
          filterPlaceholder="Find things"
          filterFunction={(i: any, s: string) => i.thingName.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => setShowCreateThing(true)}
        />
        {selectedThing && (
          <Button iconName="status-info" onClick={() => setShowShadowModal(true)}>
            View shadow
          </Button>
        )}

        {selectedThing && (
          <Container header={<Header variant="h3">Jobs — {selectedThing}</Header>}>
            <ResourceTable
              resourceName="Job"
              items={thingJobsQuery.data?.executionSummaries || []}
              columns={[
                { id: "jobId", header: "Job ID", cell: (i: any) => i.jobId || "—", isRowHeader: true },
                { id: "status", header: "Status", cell: (i: any) => i.status || i.executionSummary?.status || "—" },
                { id: "queuedAt", header: "Queued", cell: (i: any) => i.queuedAt ? new Date(i.queuedAt).toLocaleDateString() : (i.executionSummary?.queuedAt ? new Date(i.executionSummary.queuedAt).toLocaleDateString() : "—") },
              ]}
              loading={thingJobsQuery.isLoading}
              emptyMessage="No job executions for this thing."
            />
          </Container>
        )}

        {/* Create Thing Modal */}
        <Modal
          visible={showCreateThing}
          onDismiss={() => setShowCreateThing(false)}
          header="Create thing"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateThing(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createThing.isPending}
                  disabled={!newThingName.trim()}
                  onClick={() => {
                    createThing.mutate(
                      { thingName: newThingName.trim(), thingTypeName: newThingType.trim() || undefined },
                      { onSuccess: () => { setShowCreateThing(false); setNewThingName(""); setNewThingType(""); } }
                    );
                  }}
                >Create</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {createThing.isError && (
              <Alert type="error" dismissible>{(createThing.error as Error)?.message || "Failed"}</Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Thing name">
                <Input value={newThingName} onChange={({ detail }) => setNewThingName(detail.value)} placeholder="MyDevice" />
              </FormField>
              <FormField label="Thing type (optional)">
                <Input value={newThingType} onChange={({ detail }) => setNewThingType(detail.value)} placeholder="LightBulb" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Shadow Modal */}
        <Modal
          visible={showShadowModal}
          onDismiss={() => setShowShadowModal(false)}
          header={`Shadow — ${selectedThing || ""}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowShadowModal(false)}>Close</Button>
                <Button
                  variant="primary"
                  loading={updateShadow.isPending}
                  onClick={() => {
                    if (selectedThing && shadowState) {
                      try {
                        const parsed = JSON.parse(shadowState);
                        updateShadow.mutate(
                          { thingName: selectedThing, state: parsed },
                          { onSuccess: () => setShadowState("") }
                        );
                      } catch {
                        // pass
                      }
                    }
                  }}
                >Update</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Current shadow state (JSON)">
              <Textarea
                value={shadowQuery.data?.shadow ? JSON.stringify(shadowQuery.data.shadow, null, 2) : "No shadow data"}
                readOnly
                rows={8}
              />
            </FormField>
            <FormField label="Update state (JSON object)">
              <Textarea
                value={shadowState}
                onChange={({ detail }) => setShadowState(detail.value)}
                placeholder='{"desired": {"color": "green"}}'
                rows={6}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    ),
  };

  const certsTab = {
    id: "certificates",
    label: `Certificates (${certsQuery.data?.total || 0})`,
    content: (
      <SpaceBetween size="l">
        <ResourceTable
          resourceName="Certificate"
          headerTitle="IoT Certificates"
          headerCounter={certsQuery.data?.total}
          items={certs}
          columns={[
            { id: "certificateId", header: "Certificate ID", cell: (i: any) => i.certificateId.substring(0, 20) + "...", isRowHeader: true },
            {
              id: "status",
              header: "Status",
              cell: (i: any) => (
                <StatusIndicator type={i.status === "ACTIVE" ? "success" : i.status === "INACTIVE" ? "warning" : "error"}>
                  {i.status}
                </StatusIndicator>
              ),
            },
            { id: "creationDate", header: "Created", cell: (i: any) => i.creationDate },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {i.status === "ACTIVE" ? (
                    <Button
                      variant="inline-icon"
                      iconName="undo"
                      onClick={() => updateCertStatus.mutate({ certificateId: i.certificateId, newStatus: "INACTIVE" })}
                    >Deactivate</Button>
                  ) : i.status === "INACTIVE" ? (
                    <Button
                      variant="inline-icon"
                      iconName="check"
                      onClick={() => updateCertStatus.mutate({ certificateId: i.certificateId, newStatus: "ACTIVE" })}
                    >Activate</Button>
                  ) : null}
                  <DeleteButton
                    itemName={i.certificateId.substring(0, 12)}
                    resourceType="certificate"
                    loading={deleteCert.isPending && deleteCert.variables === i.certificateId}
                    onDelete={() => deleteCert.mutateAsync(i.certificateId)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          loading={certsQuery.isLoading}
          emptyMessage="No certificates. Create keys and certificate to get started."
          filterEnabled
          filterPlaceholder="Find certificates"
          filterFunction={(i: any, s: string) => i.certificateId.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => createCert.mutate(undefined, { onSuccess: () => {} })}
        />
      </SpaceBetween>
    ),
  };

  const policiesTab = {
    id: "policies",
    label: `Policies (${policiesQuery.data?.total || 0})`,
    content: (
      <SpaceBetween size="l">
        <ResourceTable
          resourceName="Policy"
          headerTitle="IoT Policies"
          headerCounter={policiesQuery.data?.total}
          items={policies}
          columns={[
            { id: "policyName", header: "Policy Name", cell: (i: any) => (
              <Button variant="link" onClick={() => setSelectedPolicy(i.policyName === selectedPolicy ? null : i.policyName)}>
                {i.policyName}
              </Button>
            ), isRowHeader: true },
            { id: "policyArn", header: "ARN", cell: (i: any) => i.policyArn },
            { id: "defaultVersionId", header: "Default Version", cell: (i: any) => i.defaultVersionId },
            { id: "creationDate", header: "Created", cell: (i: any) => i.creationDate },
            { id: "actions", header: "", cell: (i: any) => (
              <DeleteButton
                itemName={i.policyName}
                resourceType="policy"
                loading={deletePolicy.isPending && deletePolicy.variables === i.policyName}
                onDelete={() => deletePolicy.mutateAsync(i.policyName)}
              />
            )},
          ]}
          loading={policiesQuery.isLoading}
          emptyMessage="No policies. Create one to define access permissions."
          filterEnabled
          filterPlaceholder="Find policies"
          filterFunction={(i: any, s: string) => i.policyName.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => setShowCreatePolicy(true)}
        />

        {selectedPolicy && (
          <Container header={<Header variant="h3" counter={policyVersionsQuery.data?.total}>Versions — {selectedPolicy}</Header>}>
            <ResourceTable
              resourceName="Version"
              items={policyVersionsQuery.data?.policyVersions || []}
              columns={[
                { id: "versionId", header: "Version ID", cell: (i: any) => i.versionId || i.policyVersionId || "—", isRowHeader: true },
                { id: "isDefaultVersion", header: "Default", cell: (i: any) => i.isDefaultVersion ? <StatusIndicator type="success">Yes</StatusIndicator> : "—" },
                { id: "createDate", header: "Created", cell: (i: any) => i.createDate ? new Date(i.createDate).toLocaleDateString() : "—" },
              ]}
              loading={policyVersionsQuery.isLoading}
              emptyMessage="No versions for this policy."
            />
          </Container>
        )}

        <Modal
          visible={showCreatePolicy}
          onDismiss={() => setShowCreatePolicy(false)}
          header="Create policy"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreatePolicy(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createPolicy.isPending}
                  disabled={!newPolicyName.trim() || !newPolicyDoc.trim()}
                  onClick={() => {
                    createPolicy.mutate(
                      { policyName: newPolicyName.trim(), policyDocument: newPolicyDoc.trim() },
                      { onSuccess: () => { setShowCreatePolicy(false); setNewPolicyName(""); setNewPolicyDoc(""); } }
                    );
                  }}
                >Create</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {createPolicy.isError && (
              <Alert type="error" dismissible>{(createPolicy.error as Error)?.message || "Failed"}</Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Policy name">
                <Input value={newPolicyName} onChange={({ detail }) => setNewPolicyName(detail.value)} placeholder="MyIoTPolicy" />
              </FormField>
              <FormField label="Policy document (JSON)">
                <Textarea
                  value={newPolicyDoc}
                  onChange={({ detail }) => setNewPolicyDoc(detail.value)}
                  placeholder='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"iot:*","Resource":"*"}]}'
                  rows={8}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    ),
  };

  const rulesTab = {
    id: "topic-rules",
    label: `Topic Rules (${rulesQuery.data?.total || 0})`,
    content: (
      <SpaceBetween size="l">
        <ResourceTable
          resourceName="Topic Rule"
          headerTitle="IoT Topic Rules"
          headerCounter={rulesQuery.data?.total}
          items={rules}
          columns={[
            { id: "ruleName", header: "Rule Name", cell: (i: any) => i.ruleName, isRowHeader: true },
            { id: "sql", header: "SQL", cell: (i: any) => i.sql },
            { id: "description", header: "Description", cell: (i: any) => i.description },
            {
              id: "status",
              header: "Status",
              cell: (i: any) => (
                <StatusIndicator type={i.ruleDisabled ? "warning" : "success"}>
                  {i.ruleDisabled ? "Disabled" : "Enabled"}
                </StatusIndicator>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: (i: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {i.ruleDisabled ? (
                    <Button variant="inline-icon" iconName="check" onClick={() => enableRule.mutate(i.ruleName)}>Enable</Button>
                  ) : (
                    <Button variant="inline-icon" iconName="undo" onClick={() => disableRule.mutate(i.ruleName)}>Disable</Button>
                  )}
                  <DeleteButton
                    itemName={i.ruleName}
                    resourceType="rule"
                    loading={deleteRule.isPending && deleteRule.variables === i.ruleName}
                    onDelete={() => deleteRule.mutateAsync(i.ruleName)}
                  />
                </SpaceBetween>
              ),
            },
          ]}
          loading={rulesQuery.isLoading}
          emptyMessage="No topic rules. Create one to route IoT messages."
          filterEnabled
          filterPlaceholder="Find rules"
          filterFunction={(i: any, s: string) => i.ruleName.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => setShowCreateRule(true)}
        />

        <Modal
          visible={showCreateRule}
          onDismiss={() => setShowCreateRule(false)}
          header="Create topic rule"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateRule(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createRule.isPending}
                  disabled={!newRuleName.trim() || !newRuleSql.trim()}
                  onClick={() => {
                    createRule.mutate(
                      {
                        ruleName: newRuleName.trim(),
                        topicRulePayload: {
                          sql: newRuleSql.trim(),
                          description: newRuleDesc.trim() || undefined,
                          actions: newRuleActions.trim() ? [{ lambda: { functionArn: newRuleActions.trim() } }] : [],
                          ruleDisabled: false,
                          awsIotSqlVersion: "2016-03-23",
                        },
                      },
                      { onSuccess: () => { setShowCreateRule(false); setNewRuleName(""); setNewRuleSql(""); setNewRuleDesc(""); setNewRuleActions(""); } }
                    );
                  }}
                >Create</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {createRule.isError && (
              <Alert type="error" dismissible>{(createRule.error as Error)?.message || "Failed"}</Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Rule name">
                <Input value={newRuleName} onChange={({ detail }) => setNewRuleName(detail.value)} placeholder="my_rule" />
              </FormField>
              <FormField label="SQL statement" description="e.g., SELECT * FROM 'device/#'">
                <Input value={newRuleSql} onChange={({ detail }) => setNewRuleSql(detail.value)} placeholder="SELECT * FROM 'device/+'" />
              </FormField>
              <FormField label="Description (optional)">
                <Input value={newRuleDesc} onChange={({ detail }) => setNewRuleDesc(detail.value)} placeholder="Route device data" />
              </FormField>
              <FormField label="Lambda action ARN (optional)">
                <Input value={newRuleActions} onChange={({ detail }) => setNewRuleActions(detail.value)} placeholder="arn:aws:lambda:..." />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    ),
  };

  const thingTypesTab = {
    id: "thing-types",
    label: `Thing Types (${thingTypesQuery.data?.total || 0})`,
    content: (
      <SpaceBetween size="l">
        <ResourceTable
          resourceName="Thing Type"
          headerTitle="Thing Types"
          headerCounter={thingTypesQuery.data?.total}
          items={thingTypes}
          columns={[
            { id: "thingTypeName", header: "Type Name", cell: (i: any) => i.thingTypeName, isRowHeader: true },
            { id: "description", header: "Description", cell: (i: any) => i.description },
            { id: "thingTypeArn", header: "ARN", cell: (i: any) => i.thingTypeArn },
            { id: "creationDate", header: "Created", cell: (i: any) => i.creationDate },
            { id: "actions", header: "", cell: (i: any) => (
              <DeleteButton
                itemName={i.thingTypeName}
                resourceType="thing type"
                loading={deleteThingType.isPending && deleteThingType.variables === i.thingTypeName}
                onDelete={() => deleteThingType.mutateAsync(i.thingTypeName)}
              />
            )},
          ]}
          loading={thingTypesQuery.isLoading}
          emptyMessage="No thing types. Create one to categorize your devices."
          filterEnabled
          filterPlaceholder="Find types"
          filterFunction={(i: any, s: string) => i.thingTypeName.toLowerCase().includes(s.toLowerCase())}
          onCreate={() => setShowCreateThingType(true)}
        />

        <Modal
          visible={showCreateThingType}
          onDismiss={() => setShowCreateThingType(false)}
          header="Create thing type"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowCreateThingType(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  loading={createThingType.isPending}
                  disabled={!newTTName.trim()}
                  onClick={() => {
                    createThingType.mutate(
                      { thingTypeName: newTTName.trim(), thingTypeProperties: { thingTypeDescription: newTTDesc.trim() || undefined } },
                      { onSuccess: () => { setShowCreateThingType(false); setNewTTName(""); setNewTTDesc(""); } }
                    );
                  }}
                >Create</Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Form>
            {createThingType.isError && (
              <Alert type="error" dismissible>{(createThingType.error as Error)?.message || "Failed"}</Alert>
            )}
            <SpaceBetween size="m">
              <FormField label="Type name">
                <Input value={newTTName} onChange={({ detail }) => setNewTTName(detail.value)} placeholder="LightBulb" />
              </FormField>
              <FormField label="Description (optional)">
                <Input value={newTTDesc} onChange={({ detail }) => setNewTTDesc(detail.value)} placeholder="Smart light bulb" />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    ),
  };

  return (
    <SpaceBetween size="l">
      {endpointQuery.data && (
        <Alert type="info">
          IoT Endpoint: <strong>{endpointQuery.data.endpointAddress}</strong>
        </Alert>
      )}
      <Tabs
        tabs={[thingsTab, certsTab, policiesTab, rulesTab, thingTypesTab]}
      />
    </SpaceBetween>
  );
}
