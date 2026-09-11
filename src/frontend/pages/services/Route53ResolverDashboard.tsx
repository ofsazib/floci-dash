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
  useResolverEndpoints,
  useCreateResolverEndpoint,
  useUpdateResolverEndpoint,
  useDeleteResolverEndpoint,
  useResolverRules,
  useCreateResolverRule,
  useUpdateResolverRule,
  useDeleteResolverRule,
  useResolverRuleAssociations,
  useAssociateResolverRule,
  useDisassociateResolverRule,
  useFirewallDomainLists,
  useCreateFirewallDomainList,
  useDeleteFirewallDomainList,
} from "../../hooks/useRoute53Resolver";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

const DIRECTIONS = ["INBOUND", "OUTBOUND"];
const ENDPOINT_TYPES = ["IPV4", "DUALSTACK", "IPV6"];
const RULE_TYPES = ["FORWARD", "SYSTEM", "RECURSIVE"];

const cycle = (options: string[], current: string) =>
  options[(options.indexOf(current) + 1) % options.length];

/** "subnet-1,10.0.0.5" lines → IpAddressRequests */
function parseIpRequests(text: string): { SubnetId: string; Ip?: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [subnet, ip] = line.split(",").map((s) => s.trim());
      return ip ? { SubnetId: subnet, Ip: ip } : { SubnetId: subnet };
    });
}

/** "10.0.0.1,53" lines → TargetIps */
function parseTargets(text: string): { Ip: string; Port?: number }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [ip, port] = line.split(",").map((s) => s.trim());
      return port ? { Ip: ip, Port: parseInt(port, 10) } : { Ip: ip };
    });
}

function EndpointsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useResolverEndpoints();
  const create = useCreateResolverEndpoint();
  const update = useUpdateResolverEndpoint();
  const remove = useDeleteResolverEndpoint();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState("INBOUND");
  const [ipText, setIpText] = useState("");
  const [sgText, setSgText] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("IPV4");

  const endpoints: any[] = data?.endpoints || [];
  const canCreate = name.trim().length > 0 && parseIpRequests(ipText).length > 0;

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        direction,
        ipAddresses: parseIpRequests(ipText),
        securityGroupIds: sgText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setShowCreate(false);
      setName("");
      setIpText("");
      setSgText("");
      showToast("success", "Resolver endpoint created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create endpoint");
    }
  };

  const doUpdate = async () => {
    try {
      await update.mutateAsync({ id: editing.id, name: editName.trim(), endpointType: editType });
      setEditing(null);
      showToast("success", "Resolver endpoint updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update endpoint");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Resolver endpoint deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete endpoint");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="endpoint"
        loading={isLoading}
        items={endpoints}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (e: any) => e.name || "—" },
          { id: "id", header: "ID", cell: (e: any) => e.id || "—" },
          { id: "direction", header: "Direction", cell: (e: any) => e.direction || "—" },
          { id: "status", header: "Status", cell: (e: any) => e.status || "—" },
          { id: "ips", header: "IP addresses", cell: (e: any) => String(e.ipAddressCount ?? 0) },
          { id: "vpc", header: "Host VPC", cell: (e: any) => e.hostVpcId || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (e: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  variant="inline-icon"
                  iconName="edit"
                  ariaLabel={`Edit ${e.id}`}
                  onClick={() => {
                    setEditing(e);
                    setEditName(e.name || "");
                    setEditType(e.endpointType || "IPV4");
                  }}
                />
                <DeleteButton
                  itemName={e.id}
                  resourceType="endpoint"
                  onDelete={() => doDelete(e.id)}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create resolver endpoint"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!canCreate || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="inbound-endpoint" />
          </FormField>
          <FormField label="Direction">
            <Button onClick={() => setDirection(cycle(DIRECTIONS, direction))}>{direction}</Button>
          </FormField>
          <FormField
            label="IP addresses (one per line: subnetId,ip)"
            description="At least one IP address is required"
          >
            <Textarea
              value={ipText}
              onChange={({ detail }) => setIpText(detail.value)}
              rows={3}
              placeholder={"subnet-1,10.0.0.5\nsubnet-2,10.0.1.5"}
            />
          </FormField>
          <FormField label="Security group IDs (optional, comma-separated)">
            <Input value={sgText} onChange={({ detail }) => setSgText(detail.value)} placeholder="sg-1, sg-2" />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!editing}
        onDismiss={() => setEditing(null)}
        header={`Edit ${editing?.id ?? ""}`}
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
          <FormField label="Name">
            <Input value={editName} onChange={({ detail }) => setEditName(detail.value)} />
          </FormField>
          <FormField label="Endpoint type">
            <Button onClick={() => setEditType(cycle(ENDPOINT_TYPES, editType))}>{editType}</Button>
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function RulesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useResolverRules();
  const create = useCreateResolverRule();
  const update = useUpdateResolverRule();
  const remove = useDeleteResolverRule();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [ruleType, setRuleType] = useState("FORWARD");
  const [targetText, setTargetText] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editTargets, setEditTargets] = useState("");

  const rules: any[] = data?.rules || [];
  const canCreate = name.trim().length > 0;

  const doCreate = async () => {
    try {
      const targets = parseTargets(targetText);
      await create.mutateAsync({
        name: name.trim(),
        ruleType,
        domainName: domainName.trim() || undefined,
        targetIps: targets.length ? targets : undefined,
        resolverEndpointId: endpointId.trim() || undefined,
      });
      setShowCreate(false);
      setName("");
      setDomainName("");
      setTargetText("");
      setEndpointId("");
      showToast("success", "Resolver rule created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create rule");
    }
  };

  const doUpdate = async () => {
    try {
      const targets = parseTargets(editTargets);
      await update.mutateAsync({
        id: editing.id,
        name: editName.trim(),
        targetIps: targets.length ? targets : undefined,
      });
      setEditing(null);
      showToast("success", "Resolver rule updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update rule");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Resolver rule deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete rule");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="rule"
        loading={isLoading}
        items={rules}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (r: any) => r.name || "—" },
          { id: "domain", header: "Domain", cell: (r: any) => r.domainName || "—" },
          { id: "type", header: "Type", cell: (r: any) => r.ruleType || "—" },
          { id: "status", header: "Status", cell: (r: any) => r.status || "—" },
          {
            id: "targets",
            header: "Target IPs",
            cell: (r: any) => (r.targetIps || []).map((t: any) => t.Ip).join(", ") || "—",
          },
          { id: "endpoint", header: "Endpoint", cell: (r: any) => r.resolverEndpointId || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (r: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  variant="inline-icon"
                  iconName="edit"
                  ariaLabel={`Edit ${r.id}`}
                  onClick={() => {
                    setEditing(r);
                    setEditName(r.name || "");
                    setEditTargets((r.targetIps || []).map((t: any) => t.Ip).join("\n"));
                  }}
                />
                <DeleteButton itemName={r.id} resourceType="rule" onDelete={() => doDelete(r.id)} />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create resolver rule"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!canCreate || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="forward-example" />
          </FormField>
          <FormField label="Rule type">
            <Button onClick={() => setRuleType(cycle(RULE_TYPES, ruleType))}>{ruleType}</Button>
          </FormField>
          <FormField label="Domain name">
            <Input value={domainName} onChange={({ detail }) => setDomainName(detail.value)} placeholder="example.com" />
          </FormField>
          <FormField label="Target IPs (one per line: ip,port)">
            <Textarea
              value={targetText}
              onChange={({ detail }) => setTargetText(detail.value)}
              rows={3}
              placeholder={"10.0.0.1,53\n10.0.0.2,53"}
            />
          </FormField>
          <FormField label="Resolver endpoint ID">
            <Input value={endpointId} onChange={({ detail }) => setEndpointId(detail.value)} placeholder="rslvr-in-abc123" />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!editing}
        onDismiss={() => setEditing(null)}
        header={`Edit ${editing?.id ?? ""}`}
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
          <FormField label="Name">
            <Input value={editName} onChange={({ detail }) => setEditName(detail.value)} />
          </FormField>
          <FormField label="Target IPs (one per line: ip,port)">
            <Textarea value={editTargets} onChange={({ detail }) => setEditTargets(detail.value)} rows={3} />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function AssociationsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useResolverRuleAssociations();
  const { data: rulesData } = useResolverRules();
  const associate = useAssociateResolverRule();
  const disassociate = useDisassociateResolverRule();

  const [showAssociate, setShowAssociate] = useState(false);
  const [ruleIdx, setRuleIdx] = useState(0);
  const [vpcId, setVpcId] = useState("");
  const [name, setName] = useState("");

  const rows: any[] = data?.associations || [];
  const rules: any[] = rulesData?.rules || [];
  const selectedRule = rules.length ? rules[ruleIdx % rules.length] : null;
  const canAssociate = !!selectedRule && vpcId.trim().length > 0;

  const doAssociate = async () => {
    try {
      await associate.mutateAsync({
        resolverRuleId: selectedRule.id,
        vpcId: vpcId.trim(),
        name: name.trim() || undefined,
      });
      setShowAssociate(false);
      setVpcId("");
      setName("");
      showToast("success", "Rule associated with VPC");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to associate rule");
    }
  };

  const doDisassociate = async (a: any) => {
    try {
      await disassociate.mutateAsync({ resolverRuleId: a.resolverRuleId, vpcId: a.vpcId });
      showToast("success", "Rule disassociated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to disassociate rule");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="association"
        loading={isLoading}
        items={rows}
        onCreate={() => setShowAssociate(true)}
        columns={[
          { id: "name", header: "Name", cell: (a: any) => a.name || "—" },
          { id: "rule", header: "Rule ID", cell: (a: any) => a.resolverRuleId || "—" },
          { id: "vpc", header: "VPC", cell: (a: any) => a.vpcId || "—" },
          { id: "status", header: "Status", cell: (a: any) => a.status || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (a: any) => (
              <Button
                onClick={() => doDisassociate(a)}
                disabled={!a.resolverRuleId || !a.vpcId}
              >
                Disassociate
              </Button>
            ),
          },
        ]}
      />
      <Modal
        visible={showAssociate}
        onDismiss={() => setShowAssociate(false)}
        header="Associate rule with VPC"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowAssociate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doAssociate} disabled={!canAssociate || associate.isPending}>Associate</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Resolver rule">
            <Button
              onClick={() => setRuleIdx(ruleIdx + 1)}
              disabled={!rules.length}
            >
              {selectedRule ? `${selectedRule.name || selectedRule.id} (${selectedRule.id})` : "No rules available"}
            </Button>
          </FormField>
          <FormField label="VPC ID">
            <Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-0abc123" />
          </FormField>
          <FormField label="Name (optional)">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function DomainListsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useFirewallDomainLists();
  const create = useCreateFirewallDomainList();
  const remove = useDeleteFirewallDomainList();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  const lists: any[] = data?.domainLists || [];
  const canCreate = name.trim().length > 0;

  const doCreate = async () => {
    try {
      await create.mutateAsync({ name: name.trim() });
      setShowCreate(false);
      setName("");
      showToast("success", "Firewall domain list created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create domain list");
    }
  };

  const doDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      showToast("success", "Firewall domain list deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete domain list");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="domain list"
        loading={isLoading}
        items={lists}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (l: any) => l.name || "—" },
          { id: "id", header: "ID", cell: (l: any) => l.id || "—" },
          { id: "owner", header: "Managed owner", cell: (l: any) => l.managedOwnerName || "—" },
          { id: "status", header: "Status", cell: (l: any) => l.status || "—" },
          { id: "domains", header: "Domains", cell: (l: any) => String(l.domainCount ?? 0) },
          {
            id: "actions",
            header: "Actions",
            cell: (l: any) => (
              <DeleteButton itemName={l.id} resourceType="domain list" onDelete={() => doDelete(l.id)} />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create firewall domain list"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!canCreate || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Name">
          <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="my-domain-list" />
        </FormField>
      </Modal>
    </>
  );
}

export default function Route53ResolverDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "endpoints", label: "Endpoints", content: <EndpointsTab /> },
        { id: "rules", label: "Rules", content: <RulesTab /> },
        { id: "associations", label: "Rule associations", content: <AssociationsTab /> },
        { id: "domainlists", label: "Firewall domain lists", content: <DomainListsTab /> },
      ]}
    />
  );
}
