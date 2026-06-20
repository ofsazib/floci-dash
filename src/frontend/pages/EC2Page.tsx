import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ContentLayout,
  Header,
  Box,
  BreadcrumbGroup,
  SpaceBetween,
  StatusIndicator,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  Tabs,
  Container,
  Icon,
  type TabsProps,
} from "@cloudscape-design/components";
import EC2Terminal from "../components/EC2Terminal";
import EC2NetworkTopology from "../components/EC2NetworkTopology";
import {
  useEC2Instances,
  useEC2RunInstance,
  useEC2TerminateInstance,
  useEC2StartInstance,
  useEC2StopInstance,
  useEC2RebootInstance,
  useEC2Instance,
  useEC2Vpcs,
  useEC2CreateVpc,
  useEC2DeleteVpc,
  useEC2Vpc,
  useEC2Subnets,
  useEC2CreateSubnet,
  useEC2DeleteSubnet,
  useEC2SecurityGroups,
  useEC2CreateSecurityGroup,
  useEC2DeleteSecurityGroup,
  useEC2AuthorizeIngress,
  useEC2RevokeIngress,
  useEC2KeyPairs,
  useEC2CreateKeyPair,
  useEC2ImportKeyPair,
  useEC2DeleteKeyPair,
  useEC2InternetGateways,
  useEC2CreateInternetGateway,
  useEC2DeleteInternetGateway,
  useEC2AttachInternetGateway,
  useEC2DetachInternetGateway,
  useEC2RouteTables,
  useEC2CreateRouteTable,
  useEC2DeleteRouteTable,
  useEC2NatGateways,
  useEC2CreateNatGateway,
  useEC2DeleteNatGateway,
  useEC2ElasticIps,
  useEC2AllocateElasticIp,
  useEC2ReleaseElasticIp,
  useEC2LaunchTemplates,
  useEC2CreateLaunchTemplate,
  useEC2DeleteLaunchTemplate,
  useEC2Volumes,
  useEC2CreateVolume,
  useEC2DeleteVolume,
  useEC2NetworkInterfaces,
  useEC2Amis,
} from "../hooks/useEC2";
import ResourceTable from "../components/ResourceTable";
import DeleteButton from "../components/DeleteButton";
import StatusBadge from "../components/StatusBadge";

export default function EC2Page() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("instances");
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [selectedVpc, setSelectedVpc] = useState<string | null>(null);

  if (selectedInstance) {
    return <EC2InstanceDetail id={selectedInstance} onBack={() => setSelectedInstance(null)} />;
  }

  if (selectedVpc) {
    return <EC2VpcDetail id={selectedVpc} onBack={() => setSelectedVpc(null)} />;
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: "instances",
      label: "Instances",
      content: <EC2InstanceList onSelect={(id) => setSelectedInstance(id)} />,
    },
    {
      id: "vpcs",
      label: "VPCs",
      content: <EC2VpcList onSelect={(id) => setSelectedVpc(id)} />,
    },
    {
      id: "subnets",
      label: "Subnets",
      content: <EC2SubnetList />,
    },
    {
      id: "security-groups",
      label: "Security Groups",
      content: <EC2SecurityGroupList />,
    },
    {
      id: "key-pairs",
      label: "Key Pairs",
      content: <EC2KeyPairList />,
    },
    {
      id: "elastic-ips",
      label: "Elastic IPs",
      content: <EC2ElasticIpList />,
    },
    {
      id: "internet-gateways",
      label: "Internet Gateways",
      content: <EC2InternetGatewayList />,
    },
    {
      id: "route-tables",
      label: "Route Tables",
      content: <EC2RouteTableList />,
    },
    {
      id: "nat-gateways",
      label: "NAT Gateways",
      content: <EC2NatGatewayList />,
    },
    {
      id: "volumes",
      label: "Volumes",
      content: <EC2VolumeList />,
    },
    {
      id: "launch-templates",
      label: "Launch Templates",
      content: <EC2LaunchTemplateList />,
    },
    {
      id: "amis",
      label: "AMIs",
      content: <EC2AmiList />,
    },
    {
      id: "network-interfaces",
      label: "Network Interfaces",
      content: <EC2NetworkInterfaceList />,
    },
    {
      id: "topology",
      label: "Network Topology",
      content: <EC2NetworkTopology />,
    },
  ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="xs">
          <BreadcrumbGroup
            items={[
              { text: "Dashboard", href: "/#/" },
              { text: "EC2", href: "/#/services/ec2" },
            ]}
            onFollow={(e) => {
              e.preventDefault();
              navigate(e.detail.href.replace("/#", ""));
            }}
          />
          <Header variant="h1" description="Amazon Elastic Compute Cloud">
            EC2 <StatusBadge status="available" />
          </Header>
        </SpaceBetween>
      }
    >
      <Tabs
        activeTabId={selectedTab}
        onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
        tabs={tabs}
      />
    </ContentLayout>
  );
}

// ─── INSTANCES ─────────────────────────────────────────

export function EC2InstanceList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useEC2Instances();
  const runInstance = useEC2RunInstance();
  const terminateInstance = useEC2TerminateInstance();
  const startInstance = useEC2StartInstance();
  const stopInstance = useEC2StopInstance();
  const rebootInstance = useEC2RebootInstance();

  const { data: keyPairs } = useEC2KeyPairs();
  const { data: subnets } = useEC2Subnets();
  const { data: sgs } = useEC2SecurityGroups();
  const { data: amis } = useEC2Amis();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    imageId: "ami-0abcdef1234567891",
    instanceType: "t3.micro",
    keyName: "",
    subnetId: "",
    securityGroupId: "",
  });

  // Auto-detect first available AMI when launch modal opens
  useEffect(() => {
    if (showCreate && amis?.images?.length) {
      setForm(p => p.imageId === "ami-0abcdef1234567891" || !p.imageId ? { ...p, imageId: amis.images[0].id } : p);
    }
  }, [showCreate, amis]);

  // Reset auto-detection when modal closes
  useEffect(() => {
    if (!showCreate) {
      setForm(p => ({ ...p, imageId: "ami-0abcdef1234567891" }));
    }
  }, [showCreate]);

  const items = (data?.instances || [])
    .filter((i) => i.state !== "terminated")
    .map((i) => ({
      id: i.id,
      state: i.state,
      instanceType: i.instanceType,
      privateIp: i.privateIp,
      publicIp: i.publicIp,
      vpcId: i.vpcId,
      subnetId: i.subnetId,
      launchTime: i.launchTime,
      keyName: i.keyName,
    }));

  function handleCreate() {
    if (!form.imageId) return;
    runInstance.mutate(
      {
        imageId: form.imageId,
        instanceType: form.instanceType,
        ...(form.keyName ? { keyName: form.keyName } : {}),
        ...(form.subnetId ? { subnetId: form.subnetId } : {}),
        ...(form.securityGroupId ? { securityGroupIds: [form.securityGroupId] } : {}),
      },
      { onSuccess: () => setShowCreate(false) }
    );
  }

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load instances"}</StatusIndicator>}
      <ResourceTable
        resourceName="Instance"
        headerTitle="Instances"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "id", header: "Instance ID", cell: (item: any) => <Button variant="link" onClick={() => onSelect(item.id)}>{item.id}</Button>, isRowHeader: true },
          { id: "state", header: "State", cell: (item: any) => (
            <StatusIndicator type={item.state === "running" ? "success" : item.state === "stopped" ? "warning" : "in-progress"}>{item.state || "unknown"}</StatusIndicator>
          )},
          { id: "type", header: "Type", cell: (item: any) => item.instanceType },
          { id: "privateIp", header: "Private IP", cell: (item: any) => item.privateIp || "-" },
          { id: "publicIp", header: "Public IP", cell: (item: any) => item.publicIp || "-" },
          { id: "actions", header: "", cell: (item: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              {item.state === "stopped" && (
                <Button variant="icon" iconName="play" ariaLabel={`Start ${item.id}`} loading={startInstance.isPending && startInstance.variables === item.id} onClick={() => startInstance.mutate(item.id)} />
              )}
              {item.state === "running" && (
                <>
                  <Button variant="icon" iconName="undo" ariaLabel={`Stop ${item.id}`} loading={stopInstance.isPending && stopInstance.variables === item.id} onClick={() => stopInstance.mutate(item.id)} />
                  <Button variant="icon" iconName="refresh" ariaLabel={`Reboot ${item.id}`} loading={rebootInstance.isPending && rebootInstance.variables === item.id} onClick={() => rebootInstance.mutate(item.id)} />
                </>
              )}
              <DeleteButton itemName={item.id} resourceType="instance" loading={terminateInstance.isPending && terminateInstance.variables === item.id} onDelete={() => terminateInstance.mutateAsync(item.id)} />
            </SpaceBetween>
          )},
        ]}
        loading={isLoading}
        emptyMessage="No instances found"
        filterEnabled
        filterPlaceholder="Find instances by ID"
        filterFunction={(item: any, t: string) => item.id.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Launch Instance" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={runInstance.isPending} disabled={!form.imageId} onClick={handleCreate}>Launch</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          {runInstance.isError && <Alert type="error" dismissible>{(runInstance.error as Error)?.message || "Failed to launch instance"}</Alert>}
          <SpaceBetween size="m">
            <FormField label="AMI ID" description="Amazon Machine Image">
              {(amis?.images || []).length > 0 ? (
                <Select
                  selectedOption={form.imageId ? { label: form.imageId, value: form.imageId } : null}
                  onChange={({ detail }) => setForm(p => ({ ...p, imageId: detail.selectedOption.value || "" }))}
                  options={(amis?.images || []).map(img => ({
                    label: `${img.id}${img.name ? ` — ${img.name}` : ""}`,
                    description: img.platform || img.architecture || "",
                    value: img.id,
                  }))}
                />
              ) : (
                <Input value={form.imageId} onChange={({ detail }) => setForm(p => ({ ...p, imageId: detail.value }))} placeholder="ami-xxx" />
              )}
            </FormField>
            <FormField label="Instance type"><Input value={form.instanceType} onChange={({ detail }) => setForm(p => ({ ...p, instanceType: detail.value }))} placeholder="t3.micro" /></FormField>
            <FormField label="Key pair (optional)">
              <Select
                selectedOption={form.keyName ? { label: form.keyName, value: form.keyName } : { label: "No key pair", value: "" }}
                onChange={({ detail }) => setForm(p => ({ ...p, keyName: detail.selectedOption.value || "" }))}
                options={[{ label: "No key pair", value: "" }, ...(keyPairs?.keyPairs || []).map(k => ({ label: k.name, value: k.name }))]}
              />
            </FormField>
            <FormField label="Subnet (optional)">
              <Select
                selectedOption={form.subnetId ? { label: form.subnetId, value: form.subnetId } : { label: "Default", value: "" }}
                onChange={({ detail }) => setForm(p => ({ ...p, subnetId: detail.selectedOption.value || "" }))}
                options={[{ label: "Default", value: "" }, ...(subnets?.subnets || []).map(s => ({ label: `${s.id} (${s.cidrBlock})`, value: s.id }))]}
              />
            </FormField>
            <FormField label="Security group (optional)">
              <Select
                selectedOption={form.securityGroupId ? { label: form.securityGroupId, value: form.securityGroupId } : { label: "Default", value: "" }}
                onChange={({ detail }) => setForm(p => ({ ...p, securityGroupId: detail.selectedOption.value || "" }))}
                options={[{ label: "Default", value: "" }, ...(sgs?.securityGroups || []).map(sg => ({ label: `${sg.name} (${sg.id})`, value: sg.id }))]}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function EC2InstanceDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading, isError, error } = useEC2Instance(id);
  const startInstance = useEC2StartInstance();
  const stopInstance = useEC2StopInstance();
  const rebootInstance = useEC2RebootInstance();
  const terminateInstance = useEC2TerminateInstance();
  const [showTerminal, setShowTerminal] = useState(false);

  if (isLoading) return <StatusIndicator type="loading">Loading instance details...</StatusIndicator>;
  if (isError) return <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>;
  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>Back to Instances</Button>
      <Header
        variant="h2"
        description={`${data.instanceType} — ${data.state}`}
        actions={<SpaceBetween direction="horizontal" size="xs">
          {data.state === "running" && (
            <Button iconName="contact" onClick={() => setShowTerminal(true)}>Connect</Button>
          )}
          {data.state === "stopped" && <Button iconName="play" loading={startInstance.isPending} onClick={() => startInstance.mutate(id)}>Start</Button>}
          {data.state === "running" && <>
            <Button iconName="undo" loading={stopInstance.isPending} onClick={() => stopInstance.mutate(id)}>Stop</Button>
            <Button iconName="refresh" loading={rebootInstance.isPending} onClick={() => rebootInstance.mutate(id)}>Reboot</Button>
          </>}
          <DeleteButton itemName={id} resourceType="instance" loading={terminateInstance.isPending} onDelete={() => terminateInstance.mutateAsync(id).then(() => onBack())} />
        </SpaceBetween>}
      >
        {data.id}
      </Header>

      {/* Web Terminal Modal */}
      <Modal
        visible={showTerminal}
        onDismiss={() => setShowTerminal(false)}
        header={`Terminal — ${id}`}
        size="max"
      >
        <EC2Terminal instanceId={id} onClose={() => setShowTerminal(false)} />
      </Modal>

      <Box variant="div">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "State", value: data.state },
              { label: "Instance type", value: data.instanceType },
              { label: "Private IP", value: data.privateIp || "N/A" },
              { label: "Public IP", value: data.publicIp || "N/A" },
              { label: "VPC ID", value: data.vpcId || "N/A" },
              { label: "Subnet ID", value: data.subnetId || "N/A" },
              { label: "Key name", value: data.keyName || "N/A" },
              { label: "AMI ID", value: data.imageId || "N/A" },
              { label: "Availability Zone", value: data.availabilityZone || "N/A" },
              { label: "Architecture", value: data.architecture || "N/A" },
              { label: "Platform", value: data.platform || "Linux/Unix" },
              { label: "Launch time", value: data.launchTime ? new Date(data.launchTime).toLocaleString() : "N/A" },
              { label: "IAM Profile", value: data.iamInstanceProfile || "N/A" },
              { label: "EBS Optimized", value: data.ebsOptimized ? "Yes" : "No" },
              { label: "Monitoring", value: data.monitoring || "disabled" },
              { label: "Source/Dest Check", value: data.sourceDestCheck !== undefined ? (data.sourceDestCheck ? "Enabled" : "Disabled") : "N/A" },
              { label: "Root device", value: data.rootDeviceName || "N/A" },
              { label: "Root device type", value: data.rootDeviceType || "N/A" },
            ].map((row) => (
              <tr key={row.label} style={{ borderBottom: "1px solid var(--color-border-divider-default, #eaeded)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, width: "220px", verticalAlign: "top" }}>{row.label}</td>
                <td style={{ padding: "8px 12px" }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Connection Info Panel */}
      <Container header={<Header variant="h3">Connection Info</Header>}>
        <SpaceBetween size="s">
          <div>
            <Box color="text-label" fontSize="body-s" fontWeight="bold" padding={{ bottom: "xxs" }}>
              <Icon name="script" /> Docker Exec
            </Box>
            <CommandBox command={`docker exec -it floci-ec2-${id} bash`} />
          </div>
          <div>
            <Box color="text-label" fontSize="body-s" fontWeight="bold" padding={{ bottom: "xxs" }}>
              <Icon name="search" /> Find SSH Port
            </Box>
            <CommandBox command={`docker port floci-ec2-${id} 22`} />
          </div>
          <div>
            <Box color="text-label" fontSize="body-s" fontWeight="bold" padding={{ bottom: "xxs" }}>
              <Icon name="keyboard" /> SSH (replace PORT with output above)
            </Box>
            <CommandBox command="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@localhost -p PORT" />
          </div>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}

// ─── VPCS ──────────────────────────────────────────────

function EC2VpcList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, error } = useEC2Vpcs();
  const createVpc = useEC2CreateVpc();
  const deleteVpc = useEC2DeleteVpc();
  const [showCreate, setShowCreate] = useState(false);
  const [cidrBlock, setCidrBlock] = useState("10.0.0.0/16");

  const items = (data?.vpcs || []).map((v) => ({
    id: v.id,
    state: v.state,
    cidrBlock: v.cidrBlock,
    isDefault: v.isDefault,
    instanceTenancy: v.instanceTenancy,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load VPCs"}</StatusIndicator>}
      <ResourceTable
        resourceName="VPC"
        headerTitle="VPCs"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "id", header: "VPC ID", cell: (item: any) => <Button variant="link" onClick={() => onSelect(item.id)}>{item.id}</Button>, isRowHeader: true },
          { id: "state", header: "State", cell: (item: any) => item.state },
          { id: "cidr", header: "IPv4 CIDR", cell: (item: any) => item.cidrBlock },
          { id: "default", header: "Default", cell: (item: any) => item.isDefault ? "Yes" : "No" },
          { id: "tenancy", header: "Tenancy", cell: (item: any) => item.instanceTenancy },
          { id: "actions", header: "", cell: (item: any) => !item.isDefault && <DeleteButton itemName={item.id} resourceType="VPC" loading={deleteVpc.isPending && deleteVpc.variables === item.id} onDelete={() => deleteVpc.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading}
        emptyMessage="No VPCs found"
        filterEnabled
        filterPlaceholder="Find VPCs by ID"
        filterFunction={(item: any, t: string) => item.id.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />
      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create VPC" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={createVpc.isPending} onClick={() => createVpc.mutate({ cidrBlock }, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="IPv4 CIDR block" description="Default: 10.0.0.0/16"><Input value={cidrBlock} onChange={({ detail }) => setCidrBlock(detail.value)} placeholder="10.0.0.0/16" /></FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

function EC2VpcDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading, isError, error } = useEC2Vpc(id);
  const deleteVpc = useEC2DeleteVpc();

  if (isLoading) return <StatusIndicator type="loading">Loading VPC details...</StatusIndicator>;
  if (isError) return <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>;
  if (!data) return null;

  return (
    <SpaceBetween size="l">
      <Button variant="link" iconName="arrow-left" onClick={onBack}>Back to VPCs</Button>
      <Header variant="h2" description={`${data.cidrBlock} — ${data.state}`}
        actions={<SpaceBetween direction="horizontal" size="xs">
          {!data.isDefault && <DeleteButton itemName={id} resourceType="VPC" loading={deleteVpc.isPending} onDelete={() => deleteVpc.mutateAsync(id).then(() => onBack())} />}
        </SpaceBetween>}
      >
        {data.id}
      </Header>
      <Box variant="div">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              { label: "VPC ID", value: data.id },
              { label: "State", value: data.state },
              { label: "IPv4 CIDR", value: data.cidrBlock },
              { label: "Default VPC", value: data.isDefault ? "Yes" : "No" },
              { label: "Instance tenancy", value: data.instanceTenancy },
            ].map((row) => (
              <tr key={row.label} style={{ borderBottom: "1px solid var(--color-border-divider-default, #eaeded)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, width: "220px", verticalAlign: "top" }}>{row.label}</td>
                <td style={{ padding: "8px 12px" }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </SpaceBetween>
  );
}

// ─── SUBNETS ───────────────────────────────────────────

function EC2SubnetList() {
  const { data, isLoading, isError, error } = useEC2Subnets();
  const createSubnet = useEC2CreateSubnet();
  const deleteSubnet = useEC2DeleteSubnet();
  const { data: vpcs } = useEC2Vpcs();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vpcId: "", cidrBlock: "10.0.1.0/24", availabilityZone: "" });

  const items = (data?.subnets || []).map((s) => ({
    id: s.id, vpcId: s.vpcId, cidrBlock: s.cidrBlock, az: s.availabilityZone, state: s.state, ipCount: s.availableIpCount, mapPublicIp: s.mapPublicIpOnLaunch,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load subnets"}</StatusIndicator>}
      <ResourceTable
        resourceName="Subnet"
        headerTitle="Subnets"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "id", header: "Subnet ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "vpc", header: "VPC", cell: (item: any) => item.vpcId },
          { id: "cidr", header: "CIDR", cell: (item: any) => item.cidrBlock },
          { id: "az", header: "AZ", cell: (item: any) => item.az },
          { id: "ips", header: "Available IPs", cell: (item: any) => item.ipCount },
          { id: "actions", header: "", cell: (item: any) => <DeleteButton itemName={item.id} resourceType="subnet" loading={deleteSubnet.isPending && deleteSubnet.variables === item.id} onDelete={() => deleteSubnet.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading}
        emptyMessage="No subnets found"
        filterEnabled
        filterPlaceholder="Find subnets by ID"
        filterFunction={(item: any, t: string) => item.id.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Subnet" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={createSubnet.isPending} disabled={!form.vpcId} onClick={() => createSubnet.mutate(form, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form>
          <SpaceBetween size="m">
            <FormField label="VPC ID" description="Select the VPC for this subnet">
              <Select
                selectedOption={form.vpcId ? { label: form.vpcId, value: form.vpcId } : { label: "Select a VPC", value: "" }}
                onChange={({ detail }) => setForm(p => ({ ...p, vpcId: detail.selectedOption.value || "" }))}
                options={(vpcs?.vpcs || []).map(v => ({ label: `${v.id} (${v.cidrBlock})`, value: v.id }))}
              />
            </FormField>
            <FormField label="CIDR block" description="Default: 10.0.1.0/24"><Input value={form.cidrBlock} onChange={({ detail }) => setForm(p => ({ ...p, cidrBlock: detail.value }))} /></FormField>
            <FormField label="Availability Zone (optional)"><Input value={form.availabilityZone} onChange={({ detail }) => setForm(p => ({ ...p, availabilityZone: detail.value }))} placeholder="us-east-1a" /></FormField>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}

// ─── SECURITY GROUPS ───────────────────────────────────

function EC2SecurityGroupList() {
  const { data, isLoading, isError, error } = useEC2SecurityGroups();
  const createSG = useEC2CreateSecurityGroup();
  const deleteSG = useEC2DeleteSecurityGroup();
  const authorizeIngress = useEC2AuthorizeIngress();
  const revokeIngress = useEC2RevokeIngress();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ groupName: "", description: "", vpcId: "" });
  const [showRule, setShowRule] = useState<{ groupId: string; action: "add" | "remove" } | null>(null);
  const [ruleForm, setRuleForm] = useState({ ipProtocol: "tcp", fromPort: "22", toPort: "22", cidrIp: "0.0.0.0/0" });
  const { data: vpcs } = useEC2Vpcs();

  const items = (data?.securityGroups || []).map((sg) => ({
    id: sg.id, name: sg.name, description: sg.description, vpcId: sg.vpcId, rules: sg.inboundRules?.length || 0,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load security groups"}</StatusIndicator>}
      <ResourceTable
        resourceName="Security Group"
        headerTitle="Security Groups"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "id", header: "Group ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "name", header: "Name", cell: (item: any) => item.name },
          { id: "description", header: "Description", cell: (item: any) => item.description },
          { id: "vpc", header: "VPC", cell: (item: any) => item.vpcId || "-" },
          { id: "rules", header: "Inbound Rules", cell: (item: any) => item.rules },
          { id: "actions", header: "", cell: (item: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="icon" iconName="add-plus" ariaLabel="Add rule" onClick={() => { setShowRule({ groupId: item.id, action: "add" }); setRuleForm({ ipProtocol: "tcp", fromPort: "22", toPort: "22", cidrIp: "0.0.0.0/0" }); }} />
              <DeleteButton itemName={item.name} resourceType="security group" loading={deleteSG.isPending && deleteSG.variables === item.id} onDelete={() => deleteSG.mutateAsync(item.id)} />
            </SpaceBetween>
          )},
        ]}
        loading={isLoading}
        emptyMessage="No security groups found"
        filterEnabled
        filterPlaceholder="Find groups by name"
        filterFunction={(item: any, t: string) => item.name.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Security Group" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={createSG.isPending} disabled={!form.groupName} onClick={() => createSG.mutate(form, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Name"><Input value={form.groupName} onChange={({ detail }) => setForm(p => ({ ...p, groupName: detail.value }))} placeholder="my-sg" /></FormField>
          <FormField label="Description"><Input value={form.description} onChange={({ detail }) => setForm(p => ({ ...p, description: detail.value }))} placeholder="Security group description" /></FormField>
          <FormField label="VPC (optional)">
            <Select selectedOption={form.vpcId ? { label: form.vpcId, value: form.vpcId } : { label: "Default VPC", value: "" }}
              onChange={({ detail }) => setForm(p => ({ ...p, vpcId: detail.selectedOption.value || "" }))}
              options={[{ label: "Default VPC", value: "" }, ...(vpcs?.vpcs || []).map(v => ({ label: `${v.id} (${v.cidrBlock})`, value: v.id }))]} />
          </FormField>
        </SpaceBetween></Form>
      </Modal>

      <Modal visible={showRule !== null} onDismiss={() => setShowRule(null)} header={`${showRule?.action === "add" ? "Add" : "Remove"} Inbound Rule`} size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowRule(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (!showRule) return;
            const data = { groupId: showRule.groupId, ipProtocol: ruleForm.ipProtocol, fromPort: parseInt(ruleForm.fromPort), toPort: parseInt(ruleForm.toPort), cidrIp: ruleForm.cidrIp };
            if (showRule.action === "add") authorizeIngress.mutate(data, { onSuccess: () => setShowRule(null) });
            else revokeIngress.mutate(data, { onSuccess: () => setShowRule(null) });
          }}>{showRule?.action === "add" ? "Add" : "Remove"}</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Protocol"><Input value={ruleForm.ipProtocol} onChange={({ detail }) => setRuleForm(p => ({ ...p, ipProtocol: detail.value }))} placeholder="tcp" /></FormField>
          <FormField label="Port range from"><Input type="number" value={ruleForm.fromPort} onChange={({ detail }) => setRuleForm(p => ({ ...p, fromPort: detail.value }))} /></FormField>
          <FormField label="Port range to"><Input type="number" value={ruleForm.toPort} onChange={({ detail }) => setRuleForm(p => ({ ...p, toPort: detail.value }))} /></FormField>
          <FormField label="CIDR IP"><Input value={ruleForm.cidrIp} onChange={({ detail }) => setRuleForm(p => ({ ...p, cidrIp: detail.value }))} placeholder="0.0.0.0/0" /></FormField>
        </SpaceBetween></Form>
      </Modal>
    </>
  );
}

// ─── KEY PAIRS ─────────────────────────────────────────

function EC2KeyPairList() {
  const { data, isLoading, isError, error } = useEC2KeyPairs();
  const createKP = useEC2CreateKeyPair();
  const importKP = useEC2ImportKeyPair();
  const deleteKP = useEC2DeleteKeyPair();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ keyName: "", keyType: "rsa" });
  const [importForm, setImportForm] = useState({ keyName: "", publicKeyMaterial: "" });
  const [keyMaterial, setKeyMaterial] = useState<string | null>(null);

  const items = (data?.keyPairs || []).map((k) => ({ name: k.name, fingerprint: k.fingerprint, type: k.type }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load key pairs"}</StatusIndicator>}
      <ResourceTable
        resourceName="Key Pair"
        headerTitle="Key Pairs"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
          { id: "type", header: "Type", cell: (item: any) => item.type || "rsa" },
          { id: "fingerprint", header: "Fingerprint", cell: (item: any) => item.fingerprint || "-" },
          { id: "actions", header: "", cell: (item: any) => <DeleteButton itemName={item.name} resourceType="key pair" loading={deleteKP.isPending && deleteKP.variables === item.name} onDelete={() => deleteKP.mutateAsync(item.name)} /> },
        ]}
        loading={isLoading}
        emptyMessage="No key pairs found"
        filterEnabled
        filterPlaceholder="Find key pairs by name"
        filterFunction={(item: any, t: string) => item.name.toLowerCase().includes(t.toLowerCase())}
        onCreate={() => setShowCreate(true)}
      />

      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="normal" onClick={() => setShowImport(true)}>Import Key Pair</Button>
      </SpaceBetween>

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Key Pair" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={createKP.isPending} disabled={!form.keyName} onClick={() => {
            createKP.mutate({ keyName: form.keyName, keyType: form.keyType }, {
              onSuccess: (data: any) => {
                setKeyMaterial(data.keyMaterial);
                setShowCreate(false);
              },
            });
          }}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Key pair name"><Input value={form.keyName} onChange={({ detail }) => setForm(p => ({ ...p, keyName: detail.value }))} placeholder="my-key" /></FormField>
          <FormField label="Key type">
            <Select selectedOption={{ label: form.keyType === "rsa" ? "RSA" : "ED25519", value: form.keyType }}
              onChange={({ detail }) => setForm(p => ({ ...p, keyType: detail.selectedOption.value || "rsa" }))}
              options={[{ label: "RSA", value: "rsa" }, { label: "ED25519", value: "ed25519" }]} />
          </FormField>
        </SpaceBetween></Form>
      </Modal>

      <Modal visible={keyMaterial !== null} onDismiss={() => setKeyMaterial(null)} header="Key Pair Created" size="large">
        <Alert type="success">This is the only time the key material will be available. Save it now.</Alert>
        <Box padding={{ top: "m" }}>
          <textarea readOnly value={keyMaterial || ""} style={{ width: "100%", height: "200px", fontFamily: "monospace", fontSize: "12px" }} />
        </Box>
        <Box float="right" padding={{ top: "m" }}>
          <Button variant="primary" onClick={() => setKeyMaterial(null)}>I've saved the key</Button>
        </Box>
      </Modal>

      <Modal visible={showImport} onDismiss={() => setShowImport(false)} header="Import Key Pair" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowImport(false)}>Cancel</Button>
          <Button variant="primary" loading={importKP.isPending} disabled={!importForm.keyName || !importForm.publicKeyMaterial} onClick={() => importKP.mutate(importForm, { onSuccess: () => setShowImport(false) })}>Import</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Key pair name"><Input value={importForm.keyName} onChange={({ detail }) => setImportForm(p => ({ ...p, keyName: detail.value }))} placeholder="my-imported-key" /></FormField>
          <FormField label="Public key material"><Input value={importForm.publicKeyMaterial} onChange={({ detail }) => setImportForm(p => ({ ...p, publicKeyMaterial: detail.value }))} placeholder="ssh-rsa AAAA..." /></FormField>
        </SpaceBetween></Form>
      </Modal>
    </>
  );
}

// ─── ELASTIC IPs ───────────────────────────────────────

function EC2ElasticIpList() {
  const { data, isLoading, isError, error } = useEC2ElasticIps();
  const allocate = useEC2AllocateElasticIp();
  const release = useEC2ReleaseElasticIp();
  const [showAllocate, setShowAllocate] = useState(false);

  const items = (data?.addresses || []).map((a) => ({
    allocationId: a.allocationId,
    publicIp: a.publicIp,
    privateIp: a.privateIp,
    instanceId: a.instanceId,
    domain: a.domain,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load Elastic IPs"}</StatusIndicator>}
      <ResourceTable
        resourceName="Elastic IP"
        headerTitle="Elastic IPs"
        headerCounter={data?.total}
        items={items}
        columns={[
          { id: "publicIp", header: "Public IP", cell: (item: any) => item.publicIp || item.allocationId, isRowHeader: true },
          { id: "privateIp", header: "Private IP", cell: (item: any) => item.privateIp || "-" },
          { id: "instance", header: "Associated instance", cell: (item: any) => item.instanceId || "-" },
          { id: "domain", header: "Scope", cell: (item: any) => item.domain },
          { id: "actions", header: "", cell: (item: any) => <DeleteButton itemName={item.publicIp || item.allocationId} resourceType="Elastic IP" loading={release.isPending && release.variables === item.allocationId} onDelete={() => release.mutateAsync(item.allocationId)} /> },
        ]}
        loading={isLoading}
        emptyMessage="No Elastic IPs found"
        filterEnabled
        filterPlaceholder="Find by IP"
        filterFunction={(item: any, t: string) => (item.publicIp || "").includes(t)}
        onCreate={() => setShowAllocate(true)}
      />

      <Modal visible={showAllocate} onDismiss={() => setShowAllocate(false)} header="Allocate Elastic IP" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowAllocate(false)}>Cancel</Button>
          <Button variant="primary" loading={allocate.isPending} onClick={() => allocate.mutate(undefined, { onSuccess: () => setShowAllocate(false) })}>Allocate</Button>
        </SpaceBetween></Box>}
      >
        <Box>Allocate a new Elastic IP address to your account.</Box>
      </Modal>
    </>
  );
}

// ─── INTERNET GATEWAYS ─────────────────────────────────

function EC2InternetGatewayList() {
  const { data, isLoading, isError, error } = useEC2InternetGateways();
  const create = useEC2CreateInternetGateway();
  const deleteIGW = useEC2DeleteInternetGateway();
  const attach = useEC2AttachInternetGateway();
  const detach = useEC2DetachInternetGateway();
  const [showCreate, setShowCreate] = useState(false);
  const [showAttach, setShowAttach] = useState<{ id: string } | null>(null);
  const [attachVpcId, setAttachVpcId] = useState("");

  const items = (data?.internetGateways || []).map((igw) => ({
    id: igw.id,
    attachments: igw.attachments?.map((a) => `${a.vpcId} (${a.state})`).join(", ") || "None",
    ownerId: igw.ownerId,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="Internet Gateway" headerTitle="Internet Gateways" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "attachments", header: "Attachments", cell: (item: any) => item.attachments },
          { id: "actions", header: "", cell: (item: any) => (
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="icon" iconName="add-plus" ariaLabel="Attach to VPC" onClick={() => { setShowAttach({ id: item.id }); setAttachVpcId(""); }} />
              <DeleteButton itemName={item.id} resourceType="internet gateway" loading={deleteIGW.isPending && deleteIGW.variables === item.id} onDelete={() => deleteIGW.mutateAsync(item.id)} />
            </SpaceBetween>
          )},
        ]}
        loading={isLoading} emptyMessage="No internet gateways" filterEnabled onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Internet Gateway" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => create.mutate(undefined, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Box>Creates an internet gateway for use with a VPC.</Box>
      </Modal>

      <Modal visible={showAttach !== null} onDismiss={() => setShowAttach(null)} header="Attach to VPC" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowAttach(null)}>Cancel</Button>
          <Button variant="primary" disabled={!attachVpcId} onClick={() => {
            if (showAttach) attach.mutate({ id: showAttach.id, vpcId: attachVpcId }, { onSuccess: () => setShowAttach(null) });
          }}>Attach</Button>
        </SpaceBetween></Box>}
      >
        <FormField label="VPC ID"><Input value={attachVpcId} onChange={({ detail }) => setAttachVpcId(detail.value)} placeholder="vpc-xxx" /></FormField>
      </Modal>
    </>
  );
}

// ─── ROUTE TABLES ──────────────────────────────────────

function EC2RouteTableList() {
  const { data, isLoading, isError, error } = useEC2RouteTables();
  const create = useEC2CreateRouteTable();
  const deleteRT = useEC2DeleteRouteTable();
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");

  const items = (data?.routeTables || []).map((rt) => ({
    id: rt.id, vpcId: rt.vpcId, routeCount: rt.routes?.length || 0, assocCount: rt.associations?.length || 0, main: rt.associations?.some((a) => a.main) ? "Yes" : "No",
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="Route Table" headerTitle="Route Tables" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "vpc", header: "VPC", cell: (item: any) => item.vpcId },
          { id: "routes", header: "Routes", cell: (item: any) => item.routeCount },
          { id: "associations", header: "Associations", cell: (item: any) => item.assocCount },
          { id: "main", header: "Main", cell: (item: any) => item.main },
          { id: "actions", header: "", cell: (item: any) => item.main !== "Yes" && <DeleteButton itemName={item.id} resourceType="route table" loading={deleteRT.isPending && deleteRT.variables === item.id} onDelete={() => deleteRT.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading} emptyMessage="No route tables" filterEnabled onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Route Table" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" disabled={!vpcId} onClick={() => create.mutate({ vpcId }, { onSuccess: () => { setShowCreate(false); setVpcId(""); } })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <FormField label="VPC ID"><Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-xxx" /></FormField>
      </Modal>
    </>
  );
}

// ─── NAT GATEWAYS ──────────────────────────────────────

function EC2NatGatewayList() {
  const { data, isLoading, isError, error } = useEC2NatGateways();
  const create = useEC2CreateNatGateway();
  const deleteNGW = useEC2DeleteNatGateway();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subnetId: "", allocationId: "" });

  const items = (data?.natGateways || []).map((ngw) => ({
    id: ngw.id, subnetId: ngw.subnetId, vpcId: ngw.vpcId, state: ngw.state,
    publicIp: ngw.natGatewayAddresses?.[0]?.publicIp || "-",
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="NAT Gateway" headerTitle="NAT Gateways" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "state", header: "State", cell: (item: any) => <StatusIndicator type={item.state === "available" ? "success" : "in-progress"}>{item.state}</StatusIndicator> },
          { id: "subnet", header: "Subnet", cell: (item: any) => item.subnetId },
          { id: "vpc", header: "VPC", cell: (item: any) => item.vpcId },
          { id: "ip", header: "Public IP", cell: (item: any) => item.publicIp },
          { id: "actions", header: "", cell: (item: any) => <DeleteButton itemName={item.id} resourceType="NAT gateway" loading={deleteNGW.isPending && deleteNGW.variables === item.id} onDelete={() => deleteNGW.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading} emptyMessage="No NAT gateways" filterEnabled onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create NAT Gateway" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" disabled={!form.subnetId || !form.allocationId} onClick={() => create.mutate(form, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Subnet ID"><Input value={form.subnetId} onChange={({ detail }) => setForm(p => ({ ...p, subnetId: detail.value }))} placeholder="subnet-xxx" /></FormField>
          <FormField label="Elastic IP allocation ID"><Input value={form.allocationId} onChange={({ detail }) => setForm(p => ({ ...p, allocationId: detail.value }))} placeholder="eipalloc-xxx" /></FormField>
        </SpaceBetween></Form>
      </Modal>
    </>
  );
}

// ─── VOLUMES ───────────────────────────────────────────

function EC2VolumeList() {
  const { data, isLoading, isError, error } = useEC2Volumes();
  const create = useEC2CreateVolume();
  const deleteVol = useEC2DeleteVolume();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ availabilityZone: "", size: "8", volumeType: "gp2" });

  const items = (data?.volumes || []).map((v) => ({
    id: v.id, size: v.size, type: v.volumeType, state: v.state, az: v.availabilityZone, iops: v.iops,
    attachments: v.attachments?.map((a) => `${a.instanceId}:${a.device}`).join(", ") || "None",
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="Volume" headerTitle="Volumes" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "Volume ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "size", header: "Size", cell: (item: any) => `${item.size} GiB` },
          { id: "type", header: "Type", cell: (item: any) => item.type },
          { id: "state", header: "State", cell: (item: any) => <StatusIndicator type={item.state === "available" ? "success" : item.state === "in-use" ? "in-progress" : "warning"}>{item.state}</StatusIndicator> },
          { id: "az", header: "AZ", cell: (item: any) => item.az },
          { id: "attachments", header: "Attachments", cell: (item: any) => item.attachments },
          { id: "actions", header: "", cell: (item: any) => item.state === "available" && <DeleteButton itemName={item.id} resourceType="volume" loading={deleteVol.isPending && deleteVol.variables === item.id} onDelete={() => deleteVol.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading} emptyMessage="No volumes" filterEnabled onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Volume" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" disabled={!form.availabilityZone} onClick={() => create.mutate({ ...form, size: parseInt(form.size) }, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Availability Zone"><Input value={form.availabilityZone} onChange={({ detail }) => setForm(p => ({ ...p, availabilityZone: detail.value }))} placeholder="us-east-1a" /></FormField>
          <FormField label="Size (GiB)"><Input type="number" value={form.size} onChange={({ detail }) => setForm(p => ({ ...p, size: detail.value }))} /></FormField>
          <FormField label="Volume type">
            <Select selectedOption={{ label: form.volumeType.toUpperCase(), value: form.volumeType }}
              onChange={({ detail }) => setForm(p => ({ ...p, volumeType: detail.selectedOption.value || "gp2" }))}
              options={["gp2", "gp3", "io1", "io2", "sc1", "st1", "standard"].map(t => ({ label: t.toUpperCase(), value: t }))} />
          </FormField>
        </SpaceBetween></Form>
      </Modal>
    </>
  );
}

// ─── LAUNCH TEMPLATES ──────────────────────────────────

export function EC2LaunchTemplateList() {
  const { data, isLoading, isError, error } = useEC2LaunchTemplates();
  const create = useEC2CreateLaunchTemplate();
  const deleteLT = useEC2DeleteLaunchTemplate();
  const { data: amis } = useEC2Amis();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ launchTemplateName: "", imageId: "ami-0abcdef1234567891", instanceType: "t3.micro", keyName: "" });

  // Auto-detect first available AMI when create modal opens
  useEffect(() => {
    if (showCreate && amis?.images?.length) {
      setForm(p => p.imageId === "ami-0abcdef1234567891" || !p.imageId ? { ...p, imageId: amis.images[0].id } : p);
    }
  }, [showCreate, amis]);

  // Reset auto-detection when modal closes
  useEffect(() => {
    if (!showCreate) {
      setForm(p => ({ ...p, imageId: "ami-0abcdef1234567891" }));
    }
  }, [showCreate]);

  const items = (data?.launchTemplates || []).map((lt) => ({
    id: lt.id, name: lt.name, defaultVersion: lt.defaultVersion, latestVersion: lt.latestVersion, createdAt: lt.createdAt,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="Launch Template" headerTitle="Launch Templates" headerCounter={data?.total} items={items}
        columns={[
          { id: "name", header: "Name", cell: (item: any) => item.name, isRowHeader: true },
          { id: "id", header: "ID", cell: (item: any) => item.id },
          { id: "versions", header: "Versions", cell: (item: any) => `${item.latestVersion} (default: ${item.defaultVersion})` },
          { id: "actions", header: "", cell: (item: any) => <DeleteButton itemName={item.name} resourceType="launch template" loading={deleteLT.isPending && deleteLT.variables === item.id} onDelete={() => deleteLT.mutateAsync(item.id)} /> },
        ]}
        loading={isLoading} emptyMessage="No launch templates" filterEnabled onCreate={() => setShowCreate(true)}
      />

      <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} header="Create Launch Template" size="medium"
        footer={<Box float="right"><SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" disabled={!form.launchTemplateName} onClick={() => create.mutate(form, { onSuccess: () => setShowCreate(false) })}>Create</Button>
        </SpaceBetween></Box>}
      >
        <Form><SpaceBetween size="m">
          <FormField label="Template name"><Input value={form.launchTemplateName} onChange={({ detail }) => setForm(p => ({ ...p, launchTemplateName: detail.value }))} placeholder="my-template" /></FormField>
          <FormField label="AMI ID" description="Amazon Machine Image">
              {(amis?.images || []).length > 0 ? (
                <Select
                  selectedOption={form.imageId ? { label: form.imageId, value: form.imageId } : null}
                  onChange={({ detail }) => setForm(p => ({ ...p, imageId: detail.selectedOption.value || "" }))}
                  options={(amis?.images || []).map(img => ({
                    label: `${img.id}${img.name ? ` — ${img.name}` : ""}`,
                    description: img.platform || img.architecture || "",
                    value: img.id,
                  }))}
                />
              ) : (
                <Input value={form.imageId} onChange={({ detail }) => setForm(p => ({ ...p, imageId: detail.value }))} placeholder="ami-xxx" />
              )}
            </FormField>
          <FormField label="Instance type"><Input value={form.instanceType} onChange={({ detail }) => setForm(p => ({ ...p, instanceType: detail.value }))} /></FormField>
          <FormField label="Key name (optional)"><Input value={form.keyName} onChange={({ detail }) => setForm(p => ({ ...p, keyName: detail.value }))} placeholder="my-key" /></FormField>
        </SpaceBetween></Form>
      </Modal>
    </>
  );
}

// ─── AMIs ──────────────────────────────────────────────

function EC2AmiList() {
  const { data, isLoading, isError, error } = useEC2Amis();
  const items = (data?.images || []).map((img) => ({
    id: img.id, name: img.name, description: img.description, architecture: img.architecture, state: img.state, platform: img.platform || "Linux",
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="AMI" headerTitle="AMIs" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "AMI ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "name", header: "Name", cell: (item: any) => item.name || "-" },
          { id: "architecture", header: "Architecture", cell: (item: any) => item.architecture || "-" },
          { id: "platform", header: "Platform", cell: (item: any) => item.platform },
          { id: "state", header: "State", cell: (item: any) => <StatusIndicator type={item.state === "available" ? "success" : "warning"}>{item.state}</StatusIndicator> },
        ]}
        loading={isLoading} emptyMessage="No AMIs found" filterEnabled
        filterPlaceholder="Find AMIs by ID or name" filterFunction={(item: any, t: string) => item.id.toLowerCase().includes(t.toLowerCase()) || (item.name || "").toLowerCase().includes(t.toLowerCase())}
      />
    </>
  );
}

// ─── CONNECTION INFO HELPERS ───────────────────────────

function CommandBox({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      if (inputRef.current) {
        (inputRef.current as any).select();
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Input
        ref={inputRef}
        readOnly
        value={command}
        onFocus={(e: any) => {
          // Try to select text in the native input element
          const nativeInput = e.target?.querySelector?.("input") || e.target;
          nativeInput.select?.();
        }}
      />
      <Button
        variant="icon"
        iconName={copied ? "status-positive" : "copy"}
        ariaLabel={copied ? "Copied" : "Copy to clipboard"}
        onClick={handleCopy}
      />
    </div>
  );
}

// ─── NETWORK INTERFACES ────────────────────────────────

function EC2NetworkInterfaceList() {
  const { data, isLoading, isError, error } = useEC2NetworkInterfaces();
  const items = (data?.networkInterfaces || []).map((ni) => ({
    id: ni.id, vpcId: ni.vpcId, subnetId: ni.subnetId, privateIp: ni.privateIp, status: ni.status, instanceId: ni.instanceId, description: ni.description,
  }));

  return (
    <>
      {isError && <StatusIndicator type="error">{(error as Error)?.message || "Failed to load"}</StatusIndicator>}
      <ResourceTable resourceName="Network Interface" headerTitle="Network Interfaces" headerCounter={data?.total} items={items}
        columns={[
          { id: "id", header: "Interface ID", cell: (item: any) => item.id, isRowHeader: true },
          { id: "vpc", header: "VPC", cell: (item: any) => item.vpcId },
          { id: "subnet", header: "Subnet", cell: (item: any) => item.subnetId },
          { id: "privateIp", header: "Private IP", cell: (item: any) => item.privateIp },
          { id: "status", header: "Status", cell: (item: any) => item.status },
          { id: "instance", header: "Attached instance", cell: (item: any) => item.instanceId || "-" },
        ]}
        loading={isLoading} emptyMessage="No network interfaces" filterEnabled
        filterPlaceholder="Find by ID" filterFunction={(item: any, t: string) => item.id.toLowerCase().includes(t.toLowerCase())}
      />
    </>
  );
}
