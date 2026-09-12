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
  Toggle,
} from "@cloudscape-design/components";
import {
  useNfwFirewalls,
  useNfwCreateFirewall,
  useNfwDeleteFirewall,
  useNfwDeleteProtection,
  useNfwPolicyChangeProtection,
  useNfwSubnetChangeProtection,
  useNfwAzChangeProtection,
  useNfwUpdateDescription,
  useNfwAnalysisSettings,
  useNfwAssociateSubnets,
  useNfwDisassociateSubnets,
  useNfwAssociatePolicy,
  useNfwUpdateLogging,
  useNfwPolicies,
  useNfwCreatePolicy,
  useNfwDeletePolicy,
  useNfwRuleGroups,
  useNfwCreateRuleGroup,
  useNfwDeleteRuleGroup,
} from "../../hooks/useNetworkFirewall";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function FirewallsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useNfwFirewalls();
  const create = useNfwCreateFirewall();
  const remove = useNfwDeleteFirewall();
  const deleteProtection = useNfwDeleteProtection();
  const policyProtection = useNfwPolicyChangeProtection();
  const subnetProtection = useNfwSubnetChangeProtection();
  const azProtection = useNfwAzChangeProtection();
  const updateDescription = useNfwUpdateDescription();
  const analysis = useNfwAnalysisSettings();
  const associateSubnets = useNfwAssociateSubnets();
  const disassociateSubnets = useNfwDisassociateSubnets();
  const associatePolicy = useNfwAssociatePolicy();
  const updateLogging = useNfwUpdateLogging();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [subnets, setSubnets] = useState("");
  const [policyArn, setPolicyArn] = useState("");
  const [settingsFor, setSettingsFor] = useState<any>(null);
  const [deleteProt, setDeleteProt] = useState(false);
  const [policyProt, setPolicyProt] = useState(false);
  const [subnetProt, setSubnetProt] = useState(false);
  const [azProt, setAzProt] = useState(false);
  const [description, setDescription] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [assocSubnets, setAssocSubnets] = useState("");
  const [disassocSubnets, setDisassocSubnets] = useState("");
  const [newPolicyArn, setNewPolicyArn] = useState("");
  const [loggingText, setLoggingText] = useState("");

  const firewalls: any[] = data?.firewalls || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        vpcId: vpcId.trim(),
        subnetMappings: subnets.split(",").map((s) => s.trim()).filter(Boolean),
        policyArn: policyArn.trim() || undefined,
      });
      setShowCreate(false);
      setName("");
      setVpcId("");
      setSubnets("");
      setPolicyArn("");
      showToast("success", "Firewall created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create firewall");
    }
  };

  const doDelete = async (ref: any) => {
    try {
      await remove.mutateAsync({ arn: ref.arn });
      showToast("success", "Firewall deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete firewall");
    }
  };

  const doProtections = async () => {
    const ref = { arn: settingsFor.arn };
    try {
      await deleteProtection.mutateAsync({ ...ref, enabled: deleteProt });
      await policyProtection.mutateAsync({ ...ref, enabled: policyProt });
      await subnetProtection.mutateAsync({ ...ref, enabled: subnetProt });
      await azProtection.mutateAsync({ ...ref, enabled: azProt });
      await updateDescription.mutateAsync({ ...ref, description });
      if (analysisText.trim()) {
        await analysis.mutateAsync({ ...ref, analysisSettings: analysisText });
      }
      setSettingsFor(null);
      showToast("success", "Firewall settings saved");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to save firewall settings");
    }
  };

  const doSubnets = async (mode: "associate" | "disassociate") => {
    const ids = (mode === "associate" ? assocSubnets : disassocSubnets)
      .split(",").map((s) => s.trim()).filter(Boolean);
    try {
      if (mode === "associate") {
        await associateSubnets.mutateAsync({ arn: settingsFor.arn, subnetIds: ids });
      } else {
        await disassociateSubnets.mutateAsync({ arn: settingsFor.arn, subnetIds: ids });
      }
      showToast("success", mode === "associate" ? "Subnets associated" : "Subnets disassociated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update subnets");
    }
  };

  const doPolicy = async () => {
    try {
      await associatePolicy.mutateAsync({ arn: settingsFor.arn, policyArn: newPolicyArn.trim() });
      showToast("success", "Firewall policy associated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to associate policy");
    }
  };

  const doLogging = async () => {
    try {
      await updateLogging.mutateAsync({ arn: settingsFor.arn, loggingConfiguration: loggingText.trim() || undefined });
      showToast("success", "Logging configuration updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update logging");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="firewall"
        loading={isLoading}
        items={firewalls}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (f: any) => f.name || "—" },
          { id: "arn", header: "ARN", cell: (f: any) => f.arn || "—" },
          { id: "policy", header: "Policy ARN", cell: (f: any) => f.policyArn || "—" },
          { id: "vpc", header: "VPC", cell: (f: any) => f.vpcId || "—" },
          {
            id: "subnets",
            header: "Subnets",
            cell: (f: any) => (f.subnetMappings || []).map((s: any) => s.SubnetId).join(", ") || "—",
          },
          {
            id: "actions",
            header: "Actions",
            cell: (f: any) => (
              <SpaceBetween size="xxs" direction="horizontal">
                <Button
                  ariaLabel={`Configure ${f.arn}`}
                  onClick={() => {
                    setSettingsFor(f);
                    setDescription("");
                    setAnalysisText("");
                  }}
                >
                  Configure
                </Button>
                <DeleteButton itemName={f.arn} resourceType="firewall" onDelete={() => doDelete(f)} />
              </SpaceBetween>
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create firewall"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!name.trim() || !vpcId.trim() || !subnets.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="fw-1" />
          </FormField>
          <FormField label="VPC ID">
            <Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-1" />
          </FormField>
          <FormField label="Subnet IDs (comma-separated)">
            <Input value={subnets} onChange={({ detail }) => setSubnets(detail.value)} placeholder="subnet-1, subnet-2" />
          </FormField>
          <FormField label="Firewall policy ARN (optional)">
            <Input value={policyArn} onChange={({ detail }) => setPolicyArn(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
      <Modal
        visible={!!settingsFor}
        onDismiss={() => setSettingsFor(null)}
        header={`Configure ${settingsFor?.name ?? ""}`}
      >
        <SpaceBetween size="m">
          <Toggle checked={deleteProt} onChange={({ detail }) => setDeleteProt(detail.checked)}>
            Delete protection
          </Toggle>
          <Toggle checked={policyProt} onChange={({ detail }) => setPolicyProt(detail.checked)}>
            Firewall policy change protection
          </Toggle>
          <Toggle checked={subnetProt} onChange={({ detail }) => setSubnetProt(detail.checked)}>
            Subnet change protection
          </Toggle>
          <Toggle checked={azProt} onChange={({ detail }) => setAzProt(detail.checked)}>
            Availability zone change protection
          </Toggle>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
          <FormField label="Analysis settings (JSON, optional)">
            <Textarea value={analysisText} onChange={({ detail }) => setAnalysisText(detail.value)} rows={3} />
          </FormField>
          <FormField label="Associate subnets (comma-separated)">
            <SpaceBetween size="xs" direction="horizontal">
              <Input value={assocSubnets} onChange={({ detail }) => setAssocSubnets(detail.value)} />
              <Button ariaLabel="Associate subnets" disabled={!assocSubnets.trim()} onClick={() => doSubnets("associate")}>Associate</Button>
            </SpaceBetween>
          </FormField>
          <FormField label="Disassociate subnets (comma-separated)">
            <SpaceBetween size="xs" direction="horizontal">
              <Input value={disassocSubnets} onChange={({ detail }) => setDisassocSubnets(detail.value)} />
              <Button ariaLabel="Disassociate subnets" disabled={!disassocSubnets.trim()} onClick={() => doSubnets("disassociate")}>Disassociate</Button>
            </SpaceBetween>
          </FormField>
          <FormField label="Associate firewall policy ARN">
            <SpaceBetween size="xs" direction="horizontal">
              <Input value={newPolicyArn} onChange={({ detail }) => setNewPolicyArn(detail.value)} />
              <Button ariaLabel="Associate policy" disabled={!newPolicyArn.trim()} onClick={doPolicy}>Associate</Button>
            </SpaceBetween>
          </FormField>
          <FormField label="Logging configuration (JSON, optional)">
            <Textarea value={loggingText} onChange={({ detail }) => setLoggingText(detail.value)} rows={4} />
          </FormField>
          <Button onClick={doLogging}>Update logging</Button>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="link" onClick={() => setSettingsFor(null)}>Cancel</Button>
            <Button variant="primary" onClick={doProtections} loading={deleteProtection.isPending}>Save</Button>
          </SpaceBetween>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function PoliciesTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useNfwPolicies();
  const create = useNfwCreatePolicy();
  const remove = useNfwDeletePolicy();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [statelessActions, setStatelessActions] = useState("");

  const policies: any[] = data?.policies || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        firewallPolicy: statelessActions.trim()
          ? { statelessDefaultActions: statelessActions.split(",").map((s) => s.trim()).filter(Boolean) }
          : undefined,
      });
      setShowCreate(false);
      setName("");
      setStatelessActions("");
      showToast("success", "Firewall policy created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create policy");
    }
  };

  const doDelete = async (ref: any) => {
    try {
      await remove.mutateAsync({ arn: ref.arn });
      showToast("success", "Firewall policy deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete policy");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="policy"
        loading={isLoading}
        items={policies}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (p: any) => p.name || "—" },
          { id: "arn", header: "ARN", cell: (p: any) => p.arn || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (p: any) => (
              <DeleteButton itemName={p.arn} resourceType="policy" onDelete={() => doDelete(p)} />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create firewall policy"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!name.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="pol-1" />
          </FormField>
          <FormField label="Stateless default actions (comma-separated)">
            <Input value={statelessActions} onChange={({ detail }) => setStatelessActions(detail.value)} placeholder="aws:forward_to_sfe" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function RuleGroupsTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useNfwRuleGroups();
  const create = useNfwCreateRuleGroup();
  const remove = useNfwDeleteRuleGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("STATEFUL");
  const [capacity, setCapacity] = useState("100");
  const [rules, setRules] = useState("");

  const groups: any[] = data?.ruleGroups || [];

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        type,
        capacity,
        ruleGroup: rules.trim()
          ? JSON.stringify({ rulesSource: { rulesString: rules } })
          : undefined,
      });
      setShowCreate(false);
      setName("");
      setRules("");
      showToast("success", "Rule group created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create rule group");
    }
  };

  const doDelete = async (ref: any) => {
    try {
      await remove.mutateAsync({ arn: ref.arn });
      showToast("success", "Rule group deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete rule group");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="rule group"
        loading={isLoading}
        items={groups}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (g: any) => g.name || "—" },
          { id: "type", header: "Type", cell: (g: any) => g.type || "—" },
          { id: "arn", header: "ARN", cell: (g: any) => g.arn || "—" },
          {
            id: "actions",
            header: "Actions",
            cell: (g: any) => (
              <DeleteButton itemName={g.arn} resourceType="rule group" onDelete={() => doDelete(g)} />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create rule group"
        footer={
          <Box float="right">
            <SpaceBetween size="xs" direction="horizontal">
              <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={doCreate} disabled={!name.trim() || create.isPending}>Create</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="group-1" />
          </FormField>
          <FormField label="Type">
            <Button onClick={() => setType(type === "STATEFUL" ? "STATELESS" : "STATEFUL")}>{type}</Button>
          </FormField>
          <FormField label="Capacity">
            <Input value={capacity} onChange={({ detail }) => setCapacity(detail.value)} />
          </FormField>
          <FormField label="Rules (one per line, optional)">
            <Textarea value={rules} onChange={({ detail }) => setRules(detail.value)} rows={4} placeholder="pass all" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

export default function NetworkFirewallDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "firewalls", label: "Firewalls", content: <FirewallsTab /> },
        { id: "policies", label: "Policies", content: <PoliciesTab /> },
        { id: "rulegroups", label: "Rule groups", content: <RuleGroupsTab /> },
      ]}
    />
  );
}
