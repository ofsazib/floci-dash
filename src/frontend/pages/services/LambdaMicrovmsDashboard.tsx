// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Tabs,
  Modal,
  Form,
  FormField,
  Input,
  Button,
} from "@cloudscape-design/components";
import {
  useMicrovmImages,
  useMicrovmImage,
  useCreateMicrovmImage,
  useDeleteMicrovmImage,
  useMicrovmImageVersions,
  useMicrovmBuilds,
  useManagedMicrovmImages,
  useMicrovms,
  useMicrovm,
  useRunMicrovm,
  useTerminateMicrovm,
} from "../../hooks/useLambdaMicrovms";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const statusType = (s: string) =>
  s === "ACTIVE" || s === "READY" || s === "CREATED"
    ? "success"
    : s === "FAILED" || s === "DELETED" || s === "DELETING"
      ? "error"
      : s === "CREATING" || s === "BUILDING" || s === "PENDING" || s === "UPDATING"
        ? "in-progress"
        : "pending";

export function LambdaMicrovmsDashboard() {
  const { data: imgData, isLoading: imgLoading } = useMicrovmImages();
  const { data: managedData, isLoading: managedLoading } = useManagedMicrovmImages();
  const { data: vmData, isLoading: vmLoading } = useMicrovms();
  const createImage = useCreateMicrovmImage();
  const deleteImage = useDeleteMicrovmImage();
  const runMicrovm = useRunMicrovm();
  const terminateMicrovm = useTerminateMicrovm();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: imageDetail } = useMicrovmImage(selectedImage);
  const { data: versionsData } = useMicrovmImageVersions(selectedImage);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const { data: buildsData } = useMicrovmBuilds(selectedImage, selectedVersion);

  const [selectedVm, setSelectedVm] = useState<string | null>(null);
  const { data: vmDetail } = useMicrovm(selectedVm);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", baseImageArn: "", buildRoleArn: "" });

  const images = (imgData as any)?.items || [];
  const managed = (managedData as any)?.items || [];
  const microvms = (vmData as any)?.items || [];
  const versions = (versionsData as any)?.items || [];
  const builds = (buildsData as any)?.items || [];

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createImage.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        baseImageArn: form.baseImageArn || undefined,
        buildRoleArn: form.buildRoleArn || undefined,
      });
      setShowCreate(false);
      setForm({ name: "", description: "", baseImageArn: "", buildRoleArn: "" });
    } catch {}
  };

  return (
    <SpaceBetween size="l">
      <Tabs
        tabs={[
          {
            id: "images",
            label: "MicroVM Images",
            content: (
              <ResourceTable
                resourceName="MicroVM image"
                headerTitle="Lambda MicroVM Images"
                headerCounter={images.length}
                items={images.map((i: any) => ({
                  id: i.imageArn || "",
                  name: i.name || "—",
                  state: i.state || "—",
                  activeVersion: i.latestActiveImageVersion || "—",
                }))}
                loading={imgLoading}
                emptyMessage="No MicroVM images"
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    cell: (item: any) => (
                      <Button variant="link" onClick={() => { setSelectedImage(item.id); setSelectedVersion(null); }}>
                        {item.name}
                      </Button>
                    ),
                  },
                  {
                    id: "state",
                    header: "State",
                    cell: (item: any) => <StatusIndicator type={statusType(item.state)}>{item.state}</StatusIndicator>,
                  },
                  { id: "activeVersion", header: "Active Version", cell: (item: any) => item.activeVersion },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <DeleteButton
                        itemName={item.name}
                        resourceType="image"
                        onDelete={async () => { try { await deleteImage.mutateAsync(item.id); if (selectedImage === item.id) setSelectedImage(null); } catch {} }}
                        loading={deleteImage.isPending}
                      />
                    ),
                  },
                ]}
                filterEnabled
                filterPlaceholder="Find images"
                filterFunction={(i: any, s: string) => (i.name ?? "").toLowerCase().includes(s.toLowerCase())}
                onCreate={() => setShowCreate(true)}
              />
            ),
          },
          {
            id: "managed",
            label: "Managed Images",
            content: (
              <ResourceTable
                resourceName="Managed image"
                headerTitle="Managed MicroVM Images"
                headerCounter={managed.length}
                items={managed.map((m: any) => ({ id: m.imageIdentifier || m.name || "", name: m.name || m.imageIdentifier || "—" }))}
                loading={managedLoading}
                emptyMessage="No managed images"
                columns={[{ id: "name", header: "Name", cell: (item: any) => item.name }]}
              />
            ),
          },
          {
            id: "microvms",
            label: "MicroVMs",
            content: (
              <ResourceTable
                resourceName="MicroVM"
                headerTitle="Running MicroVMs"
                headerCounter={microvms.length}
                items={microvms.map((v: any) => ({
                  id: v.microvmId || "",
                  state: v.state || "—",
                  imageArn: v.imageArn || "—",
                }))}
                loading={vmLoading}
                emptyMessage="No running MicroVMs"
                columns={[
                  {
                    id: "id",
                    header: "MicroVM ID",
                    cell: (item: any) => (
                      <Button variant="link" onClick={() => setSelectedVm(item.id === selectedVm ? null : item.id)}>
                        {item.id}
                      </Button>
                    ),
                  },
                  {
                    id: "state",
                    header: "State",
                    cell: (item: any) => <StatusIndicator type={statusType(item.state)}>{item.state}</StatusIndicator>,
                  },
                  { id: "imageArn", header: "Image", cell: (item: any) => item.imageArn },
                  {
                    id: "actions",
                    header: "",
                    cell: (item: any) => (
                      <Button onClick={() => terminateMicrovm.mutate(item.id)} disabled={terminateMicrovm.isPending}>
                        Terminate
                      </Button>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Image detail + versions + builds */}
      {selectedImage && (
        <SpaceBetween size="m">
          <Header variant="h3">Image — {(imageDetail as any)?.name || selectedImage}</Header>
          <Box>State: {(imageDetail as any)?.state || "—"}</Box>
          <Box>Active Version: {(imageDetail as any)?.latestActiveImageVersion || "—"}</Box>
          <Box>Base Image: {(imageDetail as any)?.baseImageArn || "—"}</Box>

          {versions.length > 0 && (
            <ResourceTable
              resourceName="Version"
              headerTitle="Versions"
              items={versions.map((v: any) => ({
                version: v.imageVersion || "",
                state: v.state || "—",
                status: v.status || "—",
              }))}
              columns={[
                {
                  id: "version",
                  header: "Version",
                  cell: (item: any) => (
                    <Button variant="link" onClick={() => setSelectedVersion(item.version === selectedVersion ? null : item.version)}>
                      {item.version}
                    </Button>
                  ),
                },
                { id: "state", header: "State", cell: (item: any) => item.state },
                { id: "status", header: "Status", cell: (item: any) => item.status },
              ]}
            />
          )}

          {builds.length > 0 && (
            <ResourceTable
              resourceName="Build"
              headerTitle={`Builds — ${selectedVersion}`}
              items={builds.map((b: any) => ({
                buildId: b.buildId || "",
                state: b.buildState || "—",
                chipset: b.chipset || "—",
              }))}
              columns={[
                { id: "buildId", header: "Build ID", cell: (item: any) => item.buildId },
                { id: "state", header: "State", cell: (item: any) => item.state },
                { id: "chipset", header: "Chipset", cell: (item: any) => item.chipset },
              ]}
            />
          )}
        </SpaceBetween>
      )}

      {/* VM detail */}
      {selectedVm && vmDetail && (
        <SpaceBetween size="xs">
          <Header variant="h3">MicroVM — {(vmDetail as any)?.microvmId}</Header>
          <Box>State: {(vmDetail as any)?.state || "—"}</Box>
          <Box>Endpoint: {(vmDetail as any)?.endpoint || "—"}</Box>
          <Box>Image: {(vmDetail as any)?.imageArn || "—"}</Box>
          <Box>Started: {(vmDetail as any)?.startedAt || "—"}</Box>
        </SpaceBetween>
      )}

      {/* Create Image modal */}
      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create MicroVM Image">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.detail.value })} placeholder="my-image" />
            </FormField>
            <FormField label="Description">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.detail.value })} />
            </FormField>
            <FormField label="Base Image ARN">
              <Input value={form.baseImageArn} onChange={(e) => setForm({ ...form, baseImageArn: e.detail.value })} />
            </FormField>
            <FormField label="Build Role ARN">
              <Input value={form.buildRoleArn} onChange={(e) => setForm({ ...form, buildRoleArn: e.detail.value })} />
            </FormField>
            <Button onClick={handleCreate} disabled={!form.name || createImage.isPending}>
              Create Image
            </Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </SpaceBetween>
  );
}
// @v8 ignore end
