// @vitest-environment happy-dom
import { useState } from "react";
import {
  AppLayout,
  Header,
  SpaceBetween,
  Container,
  FormField,
  Input,
  Select,
  Button,
  Modal,
  Form,
  Box,
  Alert,
  Tabs,
} from "@cloudscape-design/components";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";
import {
  useAASScalableTargets,
  useRegisterAAScalableTarget,
  useDeregisterAAScalableTarget,
  useAASScalingPolicies,
  usePutAASScalingPolicy,
  useDeleteAASScalingPolicy,
} from "../../hooks/useApplicationAutoScaling";

const NAMESPACE_OPTIONS = [
  { label: "ECS", value: "ecs" },
  { label: "EC2 Spot Fleet", value: "ec2" },
  { label: "DynamoDB", value: "dynamodb" },
  { label: "RDS", value: "rds" },
  { label: "Lambda", value: "lambda" },
  { label: "ElastiCache", value: "elasticache" },
  { label: "Neptune", value: "neptune" },
];

const DIMENSION_OPTIONS = [
  { label: "ECS service desired count", value: "ecs:service:DesiredCount" },
  { label: "DynamoDB table read capacity", value: "dynamodb:table:ReadCapacityUnits" },
  { label: "DynamoDB table write capacity", value: "dynamodb:table:WriteCapacityUnits" },
  { label: "RDS cluster read replicas", value: "rds:cluster:ReadReplicaCount" },
  { label: "Lambda provisioned concurrency", value: "lambda:function:ProvisionedConcurrentExecutions" },
];

export function AppAutoScalingDashboard() {
  const [namespace, setNamespace] = useState("ecs");
  const { data: targetsData, isLoading: targetsLoading } = useAASScalableTargets(namespace);
  const { data: policiesData, isLoading: policiesLoading } = useAASScalingPolicies(namespace);

  const registerTarget = useRegisterAAScalableTarget(namespace);
  const deregisterTarget = useDeregisterAAScalableTarget(namespace);
  const putPolicy = usePutAASScalingPolicy(namespace);
  const deletePolicy = useDeleteAASScalingPolicy(namespace);

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [dimension, setDimension] = useState(DIMENSION_OPTIONS[0].value);
  const [minCapacity, setMinCapacity] = useState("1");
  const [maxCapacity, setMaxCapacity] = useState("4");

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyName, setPolicyName] = useState("");
  const [policyResourceId, setPolicyResourceId] = useState("");
  const [policyDimension, setPolicyDimension] = useState(DIMENSION_OPTIONS[0].value);
  const [targetValue, setTargetValue] = useState("50");

  return (
    <>
    <AppLayout
      content={
        <div style={{ padding: "1rem" }}>
          <Tabs
            tabs={[
              {
                id: "targets",
                label: "Scalable Targets",
                content: (
                  <SpaceBetween size="m">
                    <Container
                      header={<Header variant="h2" counter={targetsData?.total}
                        actions={<Button variant="primary" iconName="add-plus"
                          onClick={() => { setResourceId(""); setDimension(DIMENSION_OPTIONS[0].value); setMinCapacity("1"); setMaxCapacity("4"); setTargetError(null); setShowTargetModal(true); }}>
                          Register scalable target</Button>}>
                        Scalable targets
                      </Header>}
                    >
                      <FormField label="Service namespace">
                        <Select
                          selectedOption={NAMESPACE_OPTIONS.find((o) => o.value === namespace) ?? null}
                          onChange={({ detail }) => setNamespace(detail.selectedOption.value ?? "ecs")}
                          options={NAMESPACE_OPTIONS}
                        />
                      </FormField>
                    </Container>
                    <ResourceTable
                      resourceName="Scalable target"
                      headerTitle="Scalable targets"
                      headerCounter={targetsData?.total}
                      items={(targetsData?.scalableTargets || []).map((t: any) => ({
                        id: t.resourceId,
                        dimension: t.scalableDimension,
                        min: t.minCapacity,
                        max: t.maxCapacity,
                      }))}
                      loading={targetsLoading}
                      emptyMessage="No scalable targets"
                      columns={[
                        { id: "id", header: "Resource ID", cell: (i: any) => i.id, isRowHeader: true },
                        { id: "dimension", header: "Dimension", cell: (i: any) => i.dimension },
                        { id: "min", header: "Min", cell: (i: any) => i.min },
                        { id: "max", header: "Max", cell: (i: any) => i.max },
                        {
                          id: "actions",
                          header: "",
                          cell: (i: any) => (
                            <DeleteButton
                              itemName={i.id}
                              resourceType="scalable target"
                              loading={deregisterTarget.isPending && deregisterTarget.variables?.resourceId === i.id}
                              onDelete={() =>
                                deregisterTarget.mutateAsync({
                                  resourceId: i.id,
                                  scalableDimension: i.dimension,
                                })
                              }
                            />
                          ),
                        },
                      ]}
                      filterEnabled
                      filterPlaceholder="Find targets"
                      filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
                    />
                  </SpaceBetween>
                ),
              },
              {
                id: "policies",
                label: "Scaling Policies",
                content: (
                  <SpaceBetween size="m">
                    <Container
                      header={<Header variant="h2" counter={policiesData?.total}
                        actions={<Button variant="primary" iconName="add-plus"
                          onClick={() => { setPolicyName(""); setPolicyResourceId(""); setPolicyDimension(DIMENSION_OPTIONS[0].value); setTargetValue("50"); setPolicyError(null); setShowPolicyModal(true); }}>
                          Create scaling policy</Button>}>
                        Scaling policies
                      </Header>}
                    >
                      <FormField label="Service namespace">
                        <Select
                          selectedOption={NAMESPACE_OPTIONS.find((o) => o.value === namespace) ?? null}
                          onChange={({ detail }) => setNamespace(detail.selectedOption.value ?? "ecs")}
                          options={NAMESPACE_OPTIONS}
                        />
                      </FormField>
                    </Container>
                    <ResourceTable
                      resourceName="Scaling policy"
                      headerTitle="Scaling policies"
                      headerCounter={policiesData?.total}
                      items={(policiesData?.scalingPolicies || []).map((p: any) => ({
                        id: p.name,
                        resource: p.resourceId,
                        type: p.policyType,
                      }))}
                      loading={policiesLoading}
                      emptyMessage="No scaling policies"
                      columns={[
                        { id: "id", header: "Policy", cell: (i: any) => i.id, isRowHeader: true },
                        { id: "resource", header: "Resource", cell: (i: any) => i.resource },
                        { id: "type", header: "Type", cell: (i: any) => i.type },
                        {
                          id: "actions",
                          header: "",
                          cell: (i: any) => (
                            <DeleteButton
                              itemName={i.id}
                              resourceType="policy"
                              loading={deletePolicy.isPending && deletePolicy.variables?.policyName === i.id}
                              onDelete={() =>
                                deletePolicy.mutateAsync({
                                  policyName: i.id,
                                  resourceId: i.resource,
                                  scalableDimension: "ecs:service:DesiredCount",
                                })
                              }
                            />
                          ),
                        },
                      ]}
                      filterEnabled
                      filterPlaceholder="Find policies"
                      filterFunction={(i: any, s: string) => i.id.toLowerCase().includes(s.toLowerCase())}
                    />
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </div>
      }
    />

      <Modal visible={showTargetModal} onDismiss={() => setShowTargetModal(false)} header="Register scalable target">
        <Form>
          <SpaceBetween size="m">
            {targetError && <Alert type="error">{targetError}</Alert>}
            <FormField label="Resource ID">
              <Input value={resourceId} onChange={(e) => setResourceId(e.detail.value)} placeholder="cluster/service" />
            </FormField>
            <FormField label="Scalable dimension">
              <Select
                selectedOption={DIMENSION_OPTIONS.find((o) => o.value === dimension) ?? null}
                onChange={({ detail }) => setDimension(detail.selectedOption.value ?? "")}
                options={DIMENSION_OPTIONS}
              />
            </FormField>
            <FormField label="Min capacity">
              <Input value={minCapacity} onChange={(e) => setMinCapacity(e.detail.value)} inputMode="numeric" />
            </FormField>
            <FormField label="Max capacity">
              <Input value={maxCapacity} onChange={(e) => setMaxCapacity(e.detail.value)} inputMode="numeric" />
            </FormField>
            <Button
              variant="primary"
              loading={registerTarget.isPending}
              disabled={!resourceId.trim()}
              onClick={async () => {
                setTargetError(null);
                try {
                  await registerTarget.mutateAsync({
                    resourceId: resourceId.trim(),
                    scalableDimension: dimension,
                    minCapacity: parseInt(minCapacity, 10) || 1,
                    maxCapacity: parseInt(maxCapacity, 10) || 4,
                  });
                  setShowTargetModal(false);
                } catch (e: any) {
                  setTargetError(e?.message || "Failed to register scalable target");
                }
              }}
            >
              Register
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>

      <Modal visible={showPolicyModal} onDismiss={() => setShowPolicyModal(false)} header="Create scaling policy">
        <Form>
          <SpaceBetween size="m">
            {policyError && <Alert type="error">{policyError}</Alert>}
            <FormField label="Policy name">
              <Input value={policyName} onChange={(e) => setPolicyName(e.detail.value)} placeholder="scale-on-cpu" />
            </FormField>
            <FormField label="Resource ID">
              <Input value={policyResourceId} onChange={(e) => setPolicyResourceId(e.detail.value)} placeholder="cluster/service" />
            </FormField>
            <FormField label="Target value (CPU %)">
              <Input value={targetValue} onChange={(e) => setTargetValue(e.detail.value)} inputMode="decimal" />
            </FormField>
            <Button
              variant="primary"
              loading={putPolicy.isPending}
              disabled={!policyName.trim() || !policyResourceId.trim()}
              onClick={async () => {
                setPolicyError(null);
                try {
                  await putPolicy.mutateAsync({
                    policyName: policyName.trim(),
                    resourceId: policyResourceId.trim(),
                    scalableDimension: policyDimension,
                    targetTrackingConfiguration: {
                      TargetValue: parseFloat(targetValue) || 50,
                      PredefinedMetricSpecification: { PredefinedMetricType: "ECSServiceAverageCPUUtilization" },
                    },
                  });
                  setShowPolicyModal(false);
                } catch (e: any) {
                  setPolicyError(e?.message || "Failed to create scaling policy");
                }
              }}
            >
              Create policy
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}
