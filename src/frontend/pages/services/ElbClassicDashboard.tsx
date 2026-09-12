import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  Tabs,
} from "@cloudscape-design/components";
import {
  useElbLoadBalancers,
  useElbCreateLoadBalancer,
  useElbDeleteLoadBalancer,
  useElbAddListeners,
  useElbDeleteListeners,
  useElbInstanceHealth,
  useElbRegisterInstances,
  useElbDeregisterInstances,
  useElbConfigureHealthCheck,
  useElbApplySecurityGroups,
  useElbAttachSubnets,
  useElbDetachSubnets,
  useElbEnableZones,
  useElbDisableZones,
  useElbTags,
  useElbAddTags,
  useElbRemoveTags,
} from "../../hooks/useElbClassic";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function LoadBalancersTab() {
  const { showToast } = useToast();
  const { data, isLoading } = useElbLoadBalancers();
  const create = useElbCreateLoadBalancer();
  const remove = useElbDeleteLoadBalancer();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [zones, setZones] = useState("");
  const [protocol, setProtocol] = useState("HTTP");
  const [port, setPort] = useState("80");
  const [instancePort, setInstancePort] = useState("8080");

  const lbs: any[] = data?.loadBalancers || [];
  const canCreate =
    name.trim().length > 0 &&
    zones.trim().length > 0 &&
    protocol.trim().length > 0 &&
    port.trim().length > 0 &&
    instancePort.trim().length > 0;

  const doCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        zones,
        listener: { protocol, port, instancePort },
      });
      setShowCreate(false);
      setName("");
      setZones("");
      showToast("success", "Load balancer created");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to create load balancer");
    }
  };

  const doDelete = async (lbName: string) => {
    try {
      await remove.mutateAsync(lbName);
      showToast("success", "Load balancer deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete load balancer");
    }
  };

  return (
    <>
      <ResourceTable
        resourceName="load balancer"
        loading={isLoading}
        items={lbs}
        onCreate={() => setShowCreate(true)}
        columns={[
          { id: "name", header: "Name", cell: (lb: any) => lb.name || "—" },
          { id: "dns", header: "DNS name", cell: (lb: any) => lb.dnsName || "—" },
          { id: "scheme", header: "Scheme", cell: (lb: any) => lb.scheme || "—" },
          { id: "zones", header: "Zones", cell: (lb: any) => (lb.zones || []).join(", ") || "—" },
          { id: "instances", header: "Instances", cell: (lb: any) => String((lb.instances || []).length) },
          {
            id: "actions",
            header: "Actions",
            cell: (lb: any) => (
              <DeleteButton itemName={lb.name} resourceType="load balancer" onDelete={() => doDelete(lb.name)} />
            ),
          },
        ]}
      />
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create load balancer"
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
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="web-lb" />
          </FormField>
          <FormField label="Availability zones (comma-separated)">
            <Input value={zones} onChange={({ detail }) => setZones(detail.value)} placeholder="us-east-1a, us-east-1b" />
          </FormField>
          <FormField label="Listener protocol">
            <Input value={protocol} onChange={({ detail }) => setProtocol(detail.value)} />
          </FormField>
          <FormField label="Load balancer port">
            <Input value={port} onChange={({ detail }) => setPort(detail.value)} />
          </FormField>
          <FormField label="Instance port">
            <Input value={instancePort} onChange={({ detail }) => setInstancePort(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
}

function TrafficTab() {
  const { showToast } = useToast();
  const { data } = useElbLoadBalancers();
  const addListeners = useElbAddListeners();
  const deleteListeners = useElbDeleteListeners();
  const register = useElbRegisterInstances();
  const deregister = useElbDeregisterInstances();
  const healthCheck = useElbConfigureHealthCheck();

  const [idx, setIdx] = useState(0);
  const [listenerProtocol, setListenerProtocol] = useState("HTTP");
  const [listenerPort, setListenerPort] = useState("");
  const [listenerInstancePort, setListenerInstancePort] = useState("");
  const [removePorts, setRemovePorts] = useState("");
  const [registerIds, setRegisterIds] = useState("");
  const [deregisterIds, setDeregisterIds] = useState("");
  const [hcTarget, setHcTarget] = useState("");
  const [hcInterval, setHcInterval] = useState("30");

  const lbs: any[] = data?.loadBalancers || [];
  const selected = lbs.length ? lbs[idx % lbs.length] : null;
  const selectedName = selected?.name || null;
  const { data: health } = useElbInstanceHealth(selectedName);

  const run = async (fn: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await fn();
      showToast("success", ok);
    } catch (e: any) {
      showToast("error", e?.message || fallback);
    }
  };

  return (
    <SpaceBetween size="l">
      <FormField label="Load balancer">
        <Button onClick={() => setIdx(idx + 1)} disabled={!lbs.length}>
          {selected ? selected.name : "No load balancers"}
        </Button>
      </FormField>

      <ResourceTable
        resourceName="listener"
        loading={false}
        items={selected?.listeners || []}
        columns={[
          { id: "protocol", header: "Protocol", cell: (l: any) => l.Protocol || "—" },
          { id: "port", header: "LB port", cell: (l: any) => String(l.LoadBalancerPort ?? "—") },
          { id: "instancePort", header: "Instance port", cell: (l: any) => String(l.InstancePort ?? "—") },
        ]}
      />

      <SpaceBetween size="m">
        <FormField label="Add listener — protocol">
          <Input value={listenerProtocol} onChange={({ detail }) => setListenerProtocol(detail.value)} />
        </FormField>
        <FormField label="Add listener — LB port">
          <Input value={listenerPort} onChange={({ detail }) => setListenerPort(detail.value)} />
        </FormField>
        <FormField label="Add listener — instance port">
          <Input value={listenerInstancePort} onChange={({ detail }) => setListenerInstancePort(detail.value)} />
        </FormField>
        <Button
          variant="primary"
          disabled={!selectedName || !listenerPort.trim() || !listenerInstancePort.trim()}
          onClick={() =>
            run(
              () =>
                addListeners.mutateAsync({
                  name: selectedName!,
                  listeners: [{ protocol: listenerProtocol, port: listenerPort, instancePort: listenerInstancePort }],
                }),
              "Listener added",
              "Failed to add listener",
            )
          }
        >
          Add listener
        </Button>
        <FormField label="Remove listeners by ports (comma-separated)">
          <SpaceBetween size="xs" direction="horizontal">
            <Input value={removePorts} onChange={({ detail }) => setRemovePorts(detail.value)} />
            <Button
              disabled={!selectedName || !removePorts.trim()}
              onClick={() =>
                run(
                  () => deleteListeners.mutateAsync({ name: selectedName!, ports: removePorts }),
                  "Listeners removed",
                  "Failed to remove listeners",
                )
              }
            >
              Remove
            </Button>
          </SpaceBetween>
        </FormField>
      </SpaceBetween>

      <ResourceTable
        resourceName="instance state"
        loading={false}
        items={health?.instanceStates || []}
        columns={[
          { id: "instanceId", header: "Instance", cell: (s: any) => s.instanceId || "—" },
          { id: "state", header: "State", cell: (s: any) => s.state || "—" },
          { id: "reason", header: "Reason", cell: (s: any) => s.reasonCode || "—" },
        ]}
      />

      <SpaceBetween size="m">
        <FormField label="Register instances (comma-separated)">
          <SpaceBetween size="xs" direction="horizontal">
            <Input value={registerIds} onChange={({ detail }) => setRegisterIds(detail.value)} />
            <Button
              disabled={!selectedName || !registerIds.trim()}
              onClick={() =>
                run(
                  () => register.mutateAsync({ name: selectedName!, instances: registerIds }),
                  "Instances registered",
                  "Failed to register instances",
                )
              }
            >
              Register
            </Button>
          </SpaceBetween>
        </FormField>
        <FormField label="Deregister instances (comma-separated)">
          <SpaceBetween size="xs" direction="horizontal">
            <Input value={deregisterIds} onChange={({ detail }) => setDeregisterIds(detail.value)} />
            <Button
              disabled={!selectedName || !deregisterIds.trim()}
              onClick={() =>
                run(
                  () => deregister.mutateAsync({ name: selectedName!, instances: deregisterIds }),
                  "Instances deregistered",
                  "Failed to deregister instances",
                )
              }
            >
              Deregister
            </Button>
          </SpaceBetween>
        </FormField>
        <FormField label="Health check target">
          <Input value={hcTarget} onChange={({ detail }) => setHcTarget(detail.value)} placeholder="HTTP:80/health" />
        </FormField>
        <FormField label="Health check interval (seconds)">
          <Input value={hcInterval} onChange={({ detail }) => setHcInterval(detail.value)} />
        </FormField>
        <Button
          variant="primary"
          disabled={!selectedName || !hcTarget.trim()}
          onClick={() =>
            run(
              () => healthCheck.mutateAsync({ name: selectedName!, healthCheck: { target: hcTarget, interval: hcInterval } }),
              "Health check configured",
              "Failed to configure health check",
            )
          }
        >
          Configure health check
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}

function NetworkingTab() {
  const { showToast } = useToast();
  const { data } = useElbLoadBalancers();
  const applySg = useElbApplySecurityGroups();
  const attach = useElbAttachSubnets();
  const detach = useElbDetachSubnets();
  const enableZones = useElbEnableZones();
  const disableZones = useElbDisableZones();
  const addTags = useElbAddTags();
  const removeTags = useElbRemoveTags();

  const [idx, setIdx] = useState(0);
  const [zones, setZones] = useState("");
  const [subnets, setSubnets] = useState("");
  const [securityGroups, setSecurityGroups] = useState("");
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [removeKey, setRemoveKey] = useState("");
  const [tagsFor, setTagsFor] = useState<string | null>(null);

  const lbs: any[] = data?.loadBalancers || [];
  const selected = lbs.length ? lbs[idx % lbs.length] : null;
  const selectedName = selected?.name || null;
  const { data: tags } = useElbTags(tagsFor);

  const run = async (fn: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await fn();
      showToast("success", ok);
    } catch (e: any) {
      showToast("error", e?.message || fallback);
    }
  };

  return (
    <SpaceBetween size="l">
      <FormField label="Load balancer">
        <SpaceBetween size="xs" direction="horizontal">
          <Button onClick={() => setIdx(idx + 1)} disabled={!lbs.length}>
            {selected ? selected.name : "No load balancers"}
          </Button>
          <Button disabled={!selectedName} onClick={() => setTagsFor(selectedName)}>
            Load tags
          </Button>
        </SpaceBetween>
      </FormField>

      <FormField label="Enable zones (comma-separated)">
        <SpaceBetween size="xs" direction="horizontal">
          <Input value={zones} onChange={({ detail }) => setZones(detail.value)} />
          <Button
            disabled={!selectedName || !zones.trim()}
            onClick={() => run(() => enableZones.mutateAsync({ name: selectedName!, zones }), "Zones enabled", "Failed to enable zones")}
          >
            Enable
          </Button>
          <Button
            disabled={!selectedName || !zones.trim()}
            onClick={() => run(() => disableZones.mutateAsync({ name: selectedName!, zones }), "Zones disabled", "Failed to disable zones")}
          >
            Disable
          </Button>
        </SpaceBetween>
      </FormField>

      <FormField label="Subnets (comma-separated)">
        <SpaceBetween size="xs" direction="horizontal">
          <Input value={subnets} onChange={({ detail }) => setSubnets(detail.value)} />
          <Button
            disabled={!selectedName || !subnets.trim()}
            onClick={() => run(() => attach.mutateAsync({ name: selectedName!, subnets }), "Subnets attached", "Failed to attach subnets")}
          >
            Attach
          </Button>
          <Button
            disabled={!selectedName || !subnets.trim()}
            onClick={() => run(() => detach.mutateAsync({ name: selectedName!, subnets }), "Subnets detached", "Failed to detach subnets")}
          >
            Detach
          </Button>
        </SpaceBetween>
      </FormField>

      <FormField label="Security groups (comma-separated)">
        <SpaceBetween size="xs" direction="horizontal">
          <Input value={securityGroups} onChange={({ detail }) => setSecurityGroups(detail.value)} />
          <Button
            disabled={!selectedName || !securityGroups.trim()}
            onClick={() => run(() => applySg.mutateAsync({ name: selectedName!, securityGroups }), "Security groups applied", "Failed to apply security groups")}
          >
            Apply
          </Button>
        </SpaceBetween>
      </FormField>

      <ResourceTable
        resourceName="tag"
        loading={false}
        items={tags?.tags || []}
        columns={[
          { id: "key", header: "Key", cell: (t: any) => t.Key || "—" },
          { id: "value", header: "Value", cell: (t: any) => t.Value || "—" },
        ]}
      />

      <FormField label="Add tag — key">
        <Input value={tagKey} onChange={({ detail }) => setTagKey(detail.value)} />
      </FormField>
      <FormField label="Add tag — value">
        <Input value={tagValue} onChange={({ detail }) => setTagValue(detail.value)} />
      </FormField>
      <Button
        disabled={!selectedName || !tagKey.trim()}
        onClick={() =>
          run(
            () => addTags.mutateAsync({ name: selectedName!, tags: [{ Key: tagKey.trim(), Value: tagValue.trim() || undefined }] }),
            "Tag added",
            "Failed to add tag",
          )
        }
      >
        Add tag
      </Button>

      <FormField label="Remove tag by key">
        <SpaceBetween size="xs" direction="horizontal">
          <Input value={removeKey} onChange={({ detail }) => setRemoveKey(detail.value)} />
          <Button
            disabled={!selectedName || !removeKey.trim()}
            onClick={() =>
              run(
                () => removeTags.mutateAsync({ name: selectedName!, keys: removeKey }),
                "Tag removed",
                "Failed to remove tag",
              )
            }
          >
            Remove tag
          </Button>
        </SpaceBetween>
      </FormField>
    </SpaceBetween>
  );
}

export default function ElbClassicDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "lbs", label: "Load balancers", content: <LoadBalancersTab /> },
        { id: "traffic", label: "Listeners & instances", content: <TrafficTab /> },
        { id: "networking", label: "Networking & tags", content: <NetworkingTab /> },
      ]}
    />
  );
}
