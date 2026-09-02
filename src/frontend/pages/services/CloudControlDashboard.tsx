import { useState } from "react";
import {
  Box,
  SpaceBetween,
  FormField,
  Input,
  Textarea,
  Button,
  Header,
  Modal,
  Form,
} from "@cloudscape-design/components";
import {
  useCloudControlResources,
  useCloudControlResource,
  useCreateCloudControlResource,
  useDeleteCloudControlResource,
  useResourceRequestStatus,
} from "../../hooks/useCloudControl";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

export function CloudControlDashboard() {
  const [typeNameInput, setTypeNameInput] = useState("AWS::S3::Bucket");
  const [typeName, setTypeName] = useState<string | null>(null);
  const { data, isLoading } = useCloudControlResources(typeName);
  const createResource = useCreateCloudControlResource();
  const [lastRequestToken, setLastRequestToken] = useState<string | null>(null);
  const requestStatus = useResourceRequestStatus(lastRequestToken);
  const deleteResource = useDeleteCloudControlResource(typeName);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detailData } = useCloudControlResource(typeName, selected);
  const [showCreate, setShowCreate] = useState(false);
  const [desiredState, setDesiredState] = useState("{}");

  const handleCreate = async () => {
    if (!typeName) return;
    let parsed;
    try {
      parsed = JSON.parse(desiredState || "{}");
    } catch {
      return;
    }
    try {
      const res: any = await createResource.mutateAsync({ typeName, desiredState: parsed });
      setLastRequestToken(res?.requestToken ?? null);
      setShowCreate(false);
      setDesiredState("{}");
    } catch {}
  };

  const resources = (data as any)?.resourceDescriptions || [];
  let prettyProps = "—";
  const rawProps = (detailData as any)?.resourceDescription?.properties;
  if (rawProps != null) {
    try {
      prettyProps = typeof rawProps === "string" ? rawProps : JSON.stringify(rawProps);
    } catch {
      prettyProps = String(rawProps);
    }
  }

  return (
    <SpaceBetween size="l">
      <Box>
        <Header variant="h3">Resource type</Header>
        <SpaceBetween direction="horizontal" size="xs">
          <Input
            value={typeNameInput}
            onChange={(e) => setTypeNameInput(e.detail.value)}
            placeholder="AWS::S3::Bucket"
          />
          <Button
            onClick={() => {
              setTypeName(typeNameInput || null);
              setSelected(null);
            }}
          >
            Load
          </Button>
        </SpaceBetween>
      </Box>

      {lastRequestToken && (
        <Box>
          <Header variant="h3">Last request</Header>
          <SpaceBetween direction="horizontal" size="xs">
            <Box variant="small">token {lastRequestToken}</Box>
            <Box
              variant="awsui-key-label"
              color={
                requestStatus.data?.status === "SUCCESS"
                  ? "text-status-success"
                  : requestStatus.data?.status === "FAILED"
                  ? "text-status-error"
                  : "text-status-inactive"
              }
            >
              {requestStatus.data?.status ?? "PENDING"}
            </Box>
            {requestStatus.data?.identifier && (
              <Box variant="small">identifier {requestStatus.data.identifier}</Box>
            )}
            {requestStatus.data?.status === "FAILED" && requestStatus.data?.message && (
              <Box variant="small" color="text-status-error">{requestStatus.data.message}</Box>
            )}
          </SpaceBetween>
        </Box>
      )}

      <ResourceTable
        resourceName="Resource"
        headerTitle={typeName ? `Resources — ${typeName}` : "Resources"}
        headerCounter={(data as any)?.resourceDescriptions?.length ?? 0}
        items={resources.map((r: any) => ({
          id: r.identifier ?? "",
        }))}
        loading={isLoading}
        emptyMessage={
          typeName ? "No resources of this type" : "Enter a resource type and press Load"
        }
        columns={[
          {
            id: "identifier",
            header: "Identifier",
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
            id: "actions",
            header: "",
            cell: (item: any) => (
              <DeleteButton
                itemName={item.id}
                resourceType="resource"
                loading={deleteResource.isPending}
                onDelete={async () => {
                  try {
                    await deleteResource.mutateAsync(item.id);
                    if (selected === item.id) setSelected(null);
                  } catch {}
                }}
              />
            ),
          },
        ]}
        filterEnabled
        filterPlaceholder="Find resources by identifier"
        filterFunction={(i: any, s: string) =>
          (i.id ?? "").toLowerCase().includes(s.toLowerCase())
        }
        onCreate={() => setShowCreate(true)}
      />

      {selected && (
        <Box>
          <Header variant="h3">Properties — {selected}</Header>
          <Box>
            <pre>{prettyProps}</pre>
          </Box>
        </Box>
      )}

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Resource">
        <Form>
          <SpaceBetween size="m">
            <FormField label={`Type: ${typeName ?? "—"}`} />
            <FormField label="Desired state (JSON)">
              <Textarea
                value={desiredState}
                onChange={(e) => setDesiredState(e.detail.value)}
                rows={6}
              />
            </FormField>
            <Button onClick={handleCreate} disabled={!typeName || createResource.isPending}>
              Create resource
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
