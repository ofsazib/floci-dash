// @v8 ignore start — JSX-heavy dashboard, callbacks tested via integration
import { useState } from "react";
import {
  Header,
  Box,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Button,
  Select,
  Tabs,
} from "@cloudscape-design/components";
import {
  useLightsailInstances,
  useCreateLightsailInstance,
  useDeleteLightsailInstance,
  useStartLightsailInstance,
  useStopLightsailInstance,
  useRebootLightsailInstance,
  useLightsailDisks,
  useCreateLightsailDisk,
  useDeleteLightsailDisk,
  useLightsailStaticIps,
  useAllocateLightsailStaticIp,
  useReleaseLightsailStaticIp,
  useLightsailKeyPairs,
  useCreateLightsailKeyPair,
  useDeleteLightsailKeyPair,
} from "../../hooks/useLightsail";
import ResourceTable from "../../components/ResourceTable";

const BUNDLE_OPTIONS = [
  { value: "nano_3_0", label: "nano_3_0 (1 vCPU, 0.5 GB)" },
  { value: "micro_3_0", label: "micro_3_0 (1 vCPU, 1 GB)" },
  { value: "small_3_0", label: "small_3_0 (1 vCPU, 2 GB)" },
  { value: "medium_3_0", label: "medium_3_0 (2 vCPU, 4 GB)" },
];

const AZ_OPTIONS = [
  { value: "us-east-1a", label: "us-east-1a" },
  { value: "us-east-1b", label: "us-east-1b" },
  { value: "us-west-2a", label: "us-west-2a" },
];

const BP_OPTIONS = [
  { value: "ubuntu_22_04", label: "Ubuntu 22.04" },
  { value: "amazon_linux_2023", label: "Amazon Linux 2023" },
];

export function LightsailDashboard() {
  const [activeTab, setActiveTab] = useState("instances");

  // Instances
  const { data: instancesData, isLoading: instancesLoading } = useLightsailInstances();
  const createInstance = useCreateLightsailInstance();
  const deleteInstance = useDeleteLightsailInstance();
  const startInstance = useStartLightsailInstance();
  const stopInstance = useStopLightsailInstance();
  const rebootInstance = useRebootLightsailInstance();
  const [showCreateInstance, setShowCreateInstance] = useState(false);
  const [instForm, setInstForm] = useState({ name: "", bundleId: "nano_3_0", az: "us-east-1a", bp: "ubuntu_22_04" });

  // Disks
  const { data: disksData, isLoading: disksLoading } = useLightsailDisks();
  const createDisk = useCreateLightsailDisk();
  const deleteDisk = useDeleteLightsailDisk();
  const [showCreateDisk, setShowCreateDisk] = useState(false);
  const [diskForm, setDiskForm] = useState({ name: "", sizeGb: "8", az: "us-east-1a" });

  // Static IPs
  const { data: staticIpsData, isLoading: staticIpsLoading } = useLightsailStaticIps();
  const allocateStaticIp = useAllocateLightsailStaticIp();
  const releaseStaticIp = useReleaseLightsailStaticIp();
  const [showCreateStaticIp, setShowCreateStaticIp] = useState(false);
  const [sipName, setSipName] = useState("");

  // Key Pairs
  const { data: keyPairsData, isLoading: keyPairsLoading } = useLightsailKeyPairs();
  const createKeyPair = useCreateLightsailKeyPair();
  const deleteKeyPair = useDeleteLightsailKeyPair();
  const [showCreateKP, setShowCreateKP] = useState(false);
  const [kpName, setKpName] = useState("");

  const handleCreateInstance = async () => {
    if (!instForm.name) return;
    try {
      await createInstance.mutateAsync({
        instanceNames: [instForm.name],
        bundleId: instForm.bundleId,
        availabilityZone: instForm.az,
        blueprintId: instForm.bp,
      });
      setShowCreateInstance(false);
      setInstForm({ name: "", bundleId: "nano_3_0", az: "us-east-1a", bp: "ubuntu_22_04" });
    } catch {}
  };

  const handleCreateDisk = async () => {
    if (!diskForm.name) return;
    try {
      await createDisk.mutateAsync({ diskName: diskForm.name, sizeInGb: parseInt(diskForm.sizeGb) || 8, availabilityZone: diskForm.az });
      setShowCreateDisk(false);
      setDiskForm({ name: "", sizeGb: "8", az: "us-east-1a" });
    } catch {}
  };

  const handleAllocateSip = async () => {
    if (!sipName) return;
    try {
      await allocateStaticIp.mutateAsync({ staticIpName: sipName });
      setShowCreateStaticIp(false);
      setSipName("");
    } catch {}
  };

  const handleCreateKP = async () => {
    if (!kpName) return;
    try {
      await createKeyPair.mutateAsync({ keyPairName: kpName });
      setShowCreateKP(false);
      setKpName("");
    } catch {}
  };

  return (
    <>
      <Tabs
        activeTabId={activeTab}
        onChange={(e) => setActiveTab(e.detail.activeTabId)}
        tabs={[
          {
            label: `Instances (${(instancesData as any)?.instances?.length || 0})`,
            id: "instances",
            content: (
              <SpaceBetween size="m">
                <Header actions={<Button onClick={() => setShowCreateInstance(true)}>Create Instance</Button>}>Instances</Header>
                {instancesLoading ? <Box>Loading...</Box> : (
                  <ResourceTable
                    resourceName="Instance"
                    headerTitle="Instances"
                    headerCounter={(instancesData as any)?.instances?.length}
                    items={((instancesData as any)?.instances || []).map((i: any) => ({
                      name: i.name,
                      state: i.state?.name || "unknown",
                      publicIp: i.publicIpAddress || "-",
                      bundle: i.bundleId || "-",
                    }))}
                    columns={[
                      { id: "name", header: "Name", cell: (item: any) => item.name },
                      { id: "state", header: "State", cell: (item: any) => <StatusIndicator type={item.state === "running" ? "success" : "stopped"}>{item.state}</StatusIndicator> },
                      { id: "publicIp", header: "Public IP", cell: (item: any) => item.publicIp },
                      { id: "bundle", header: "Bundle", cell: (item: any) => item.bundle },
                      {
                        id: "actions", header: "Actions", cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            {item.state !== "running" && <Button onClick={() => startInstance.mutate(item.name)} disabled={startInstance.isPending}>Start</Button>}
                            {item.state === "running" && <Button onClick={() => stopInstance.mutate(item.name)} disabled={stopInstance.isPending}>Stop</Button>}
                            {item.state === "running" && <Button onClick={() => rebootInstance.mutate(item.name)} disabled={rebootInstance.isPending}>Reboot</Button>}
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    onDelete={(item: any) => deleteInstance.mutate(item.name)}
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: `Disks (${(disksData as any)?.disks?.length || 0})`,
            id: "disks",
            content: (
              <SpaceBetween size="m">
                <Header actions={<Button onClick={() => setShowCreateDisk(true)}>Create Disk</Button>}>Disks</Header>
                {disksLoading ? <Box>Loading...</Box> : (
                  <ResourceTable
                    resourceName="Disk"
                    headerTitle="Disks"
                    headerCounter={(disksData as any)?.disks?.length}
                    items={((disksData as any)?.disks || []).map((d: any) => ({
                      name: d.name,
                      sizeGb: d.sizeInGb || "-",
                      path: d.path || "-",
                      attachedTo: d.attachedTo || "-",
                    }))}
                    columns={[
                      { id: "name", header: "Name", cell: (item: any) => item.name },
                      { id: "sizeGb", header: "Size (GB)", cell: (item: any) => item.sizeGb },
                      { id: "path", header: "Path", cell: (item: any) => item.path },
                      { id: "attachedTo", header: "Attached To", cell: (item: any) => item.attachedTo },
                    ]}
                    onDelete={(item: any) => deleteDisk.mutate(item.name)}
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: `Static IPs (${(staticIpsData as any)?.staticIps?.length || 0})`,
            id: "static-ips",
            content: (
              <SpaceBetween size="m">
                <Header actions={<Button onClick={() => setShowCreateStaticIp(true)}>Allocate Static IP</Button>}>Static IPs</Header>
                {staticIpsLoading ? <Box>Loading...</Box> : (
                  <ResourceTable
                    resourceName="Static IP"
                    headerTitle="Static IPs"
                    headerCounter={(staticIpsData as any)?.staticIps?.length}
                    items={((staticIpsData as any)?.staticIps || []).map((s: any) => ({
                      name: s.name,
                      ip: s.ipAddress || "-",
                      attachedTo: s.attachedTo || "-",
                    }))}
                    columns={[
                      { id: "name", header: "Name", cell: (item: any) => item.name },
                      { id: "ip", header: "IP Address", cell: (item: any) => item.ip },
                      { id: "attachedTo", header: "Attached To", cell: (item: any) => item.attachedTo },
                    ]}
                    onDelete={(item: any) => releaseStaticIp.mutate(item.name)}
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: `Key Pairs (${(keyPairsData as any)?.keyPairs?.length || 0})`,
            id: "key-pairs",
            content: (
              <SpaceBetween size="m">
                <Header actions={<Button onClick={() => setShowCreateKP(true)}>Create Key Pair</Button>}>Key Pairs</Header>
                {keyPairsLoading ? <Box>Loading...</Box> : (
                  <ResourceTable
                    resourceName="Key Pair"
                    headerTitle="Key Pairs"
                    headerCounter={(keyPairsData as any)?.keyPairs?.length}
                    items={((keyPairsData as any)?.keyPairs || []).map((k: any) => ({
                      name: k.name,
                      fingerprint: k.fingerprint || "-",
                    }))}
                    columns={[
                      { id: "name", header: "Name", cell: (item: any) => item.name },
                      { id: "fingerprint", header: "Fingerprint", cell: (item: any) => item.fingerprint },
                    ]}
                    onDelete={(item: any) => deleteKeyPair.mutate(item.name)}
                  />
                )}
              </SpaceBetween>
            ),
          },
        ]}
      />

      {/* Create Instance Modal */}
      <Modal visible={showCreateInstance} onDismiss={() => setShowCreateInstance(false)} header="Create Instance">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Instance Name"><Input value={instForm.name} onChange={(e) => setInstForm({ ...instForm, name: e.detail.value })} /></FormField>
            <FormField label="Bundle">
              <Select selectedOption={BUNDLE_OPTIONS.find((o) => o.value === instForm.bundleId) || BUNDLE_OPTIONS[0]} options={BUNDLE_OPTIONS} onChange={(e) => setInstForm({ ...instForm, bundleId: e.detail.selectedOption.value || "nano_3_0" })} />
            </FormField>
            <FormField label="Availability Zone">
              <Select selectedOption={AZ_OPTIONS.find((o) => o.value === instForm.az) || AZ_OPTIONS[0]} options={AZ_OPTIONS} onChange={(e) => setInstForm({ ...instForm, az: e.detail.selectedOption.value || "us-east-1a" })} />
            </FormField>
            <FormField label="Blueprint">
              <Select selectedOption={BP_OPTIONS.find((o) => o.value === instForm.bp) || BP_OPTIONS[0]} options={BP_OPTIONS} onChange={(e) => setInstForm({ ...instForm, bp: e.detail.selectedOption.value || "ubuntu_22_04" })} />
            </FormField>
            <Button onClick={handleCreateInstance} disabled={!instForm.name || createInstance.isPending}>Create</Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create Disk Modal */}
      <Modal visible={showCreateDisk} onDismiss={() => setShowCreateDisk(false)} header="Create Disk">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Disk Name"><Input value={diskForm.name} onChange={(e) => setDiskForm({ ...diskForm, name: e.detail.value })} /></FormField>
            <FormField label="Size (GB)"><Input value={diskForm.sizeGb} onChange={(e) => setDiskForm({ ...diskForm, sizeGb: e.detail.value })} /></FormField>
            <FormField label="Availability Zone">
              <Select selectedOption={AZ_OPTIONS.find((o) => o.value === diskForm.az) || AZ_OPTIONS[0]} options={AZ_OPTIONS} onChange={(e) => setDiskForm({ ...diskForm, az: e.detail.selectedOption.value || "us-east-1a" })} />
            </FormField>
            <Button onClick={handleCreateDisk} disabled={!diskForm.name || createDisk.isPending}>Create</Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Allocate Static IP Modal */}
      <Modal visible={showCreateStaticIp} onDismiss={() => setShowCreateStaticIp(false)} header="Allocate Static IP">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Static IP Name"><Input value={sipName} onChange={(e) => setSipName(e.detail.value)} /></FormField>
            <Button onClick={handleAllocateSip} disabled={!sipName || allocateStaticIp.isPending}>Allocate</Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create Key Pair Modal */}
      <Modal visible={showCreateKP} onDismiss={() => setShowCreateKP(false)} header="Create Key Pair">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Key Pair Name"><Input value={kpName} onChange={(e) => setKpName(e.detail.value)} /></FormField>
            <Button onClick={handleCreateKP} disabled={!kpName || createKeyPair.isPending}>Create</Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}
// @v8 ignore end
