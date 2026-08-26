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
  useMQBrokers,
  useCreateMQBroker,
  useDeleteMQBroker,
  useRebootMQBroker,
  useMQUsers,
  useCreateMQUser,
  useDeleteMQUser,
} from "../../hooks/useAmazonMQ";
import ResourceTable from "../../components/ResourceTable";

const ENGINE_OPTIONS = [
  { value: "ActiveMQ", label: "ActiveMQ" },
  { value: "RabbitMQ", label: "RabbitMQ" },
];

const INSTANCE_OPTIONS = [
  { value: "mq.t2.micro", label: "mq.t2.micro" },
  { value: "mq.t3.micro", label: "mq.t3.micro" },
  { value: "mq.m5.large", label: "mq.m5.large" },
];

export function AmazonMQDashboard() {
  const [activeTab, setActiveTab] = useState("brokers");

  // Brokers
  const { data: brokersData, isLoading: brokersLoading } = useMQBrokers();
  const createBroker = useCreateMQBroker();
  const deleteBroker = useDeleteMQBroker();
  const rebootBroker = useRebootMQBroker();
  const [showCreateBroker, setShowCreateBroker] = useState(false);
  const [brokerForm, setBrokerForm] = useState({
    brokerName: "",
    engineType: "ActiveMQ",
    hostInstanceType: "mq.t2.micro",
    deploymentMode: "SINGLE_INSTANCE",
  });

  // Users
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const { data: usersData, isLoading: usersLoading } = useMQUsers(selectedBrokerId);
  const createUser = useCreateMQUser();
  const deleteUser = useDeleteMQUser();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", password: "" });

  const handleCreateBroker = async () => {
    if (!brokerForm.brokerName) return;
    try {
      await createBroker.mutateAsync({
        brokerName: brokerForm.brokerName,
        engineType: brokerForm.engineType,
        hostInstanceType: brokerForm.hostInstanceType,
        deploymentMode: brokerForm.deploymentMode,
        publiclyAccessible: true,
      });
      setShowCreateBroker(false);
      setBrokerForm({ brokerName: "", engineType: "ActiveMQ", hostInstanceType: "mq.t2.micro", deploymentMode: "SINGLE_INSTANCE" });
    } catch {}
  };

  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.password || !selectedBrokerId) return;
    try {
      await createUser.mutateAsync({
        brokerId: selectedBrokerId,
        username: userForm.username,
        password: userForm.password,
      });
      setShowCreateUser(false);
      setUserForm({ username: "", password: "" });
    } catch {}
  };

  return (
    <>
      <Tabs
        activeTabId={activeTab}
        onChange={(e) => setActiveTab(e.detail.activeTabId)}
        tabs={[
          {
            label: `Brokers (${(brokersData as any)?.brokers?.length || 0})`,
            id: "brokers",
            content: (
              <SpaceBetween size="m">
                <Header actions={<Button onClick={() => setShowCreateBroker(true)}>Create Broker</Button>}>Brokers</Header>
                {brokersLoading ? <Box>Loading...</Box> : (
                  <ResourceTable
                    resourceName="Broker"
                    headerTitle="Brokers"
                    headerCounter={(brokersData as any)?.brokers?.length}
                    items={((brokersData as any)?.brokers || []).map((b: any) => ({
                      id: b.brokerId || b.id,
                      name: b.brokerName || b.brokerName,
                      state: b.brokerState || "UNKNOWN",
                      engine: b.engineType || "-",
                      instanceType: b.hostInstanceType || "-",
                    }))}
                    columns={[
                      { id: "name", header: "Name", cell: (item: any) => item.name },
                      { id: "state", header: "State", cell: (item: any) => <StatusIndicator type={item.state === "RUNNING" ? "success" : "stopped"}>{item.state}</StatusIndicator> },
                      { id: "engine", header: "Engine", cell: (item: any) => item.engine },
                      { id: "instanceType", header: "Instance Type", cell: (item: any) => item.instanceType },
                      {
                        id: "actions", header: "Actions", cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => { setSelectedBrokerId(item.id); setActiveTab("users"); }}>Users</Button>
                            <Button onClick={() => rebootBroker.mutate(item.id)} disabled={rebootBroker.isPending}>Reboot</Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    onDelete={(item: any) => deleteBroker.mutate(item.id)}
                  />
                )}
              </SpaceBetween>
            ),
          },
          {
            label: `Users (${(usersData as any)?.users?.length || 0})`,
            id: "users",
            content: (
              <SpaceBetween size="m">
                <Header
                  actions={
                    <Button onClick={() => setShowCreateUser(true)} disabled={!selectedBrokerId}>Create User</Button>
                  }
                >
                  Users {selectedBrokerId ? `(Broker: ${selectedBrokerId})` : ""}
                </Header>
                {!selectedBrokerId ? (
                  <Box>Select a broker from the Brokers tab to manage users.</Box>
                ) : usersLoading ? (
                  <Box>Loading...</Box>
                ) : (
                  <ResourceTable
                    resourceName="User"
                    headerTitle="Users"
                    headerCounter={(usersData as any)?.users?.length}
                    items={((usersData as any)?.users || []).map((u: any) => ({
                      username: u.username,
                      groups: (u.groups || []).join(", "),
                    }))}
                    columns={[
                      { id: "username", header: "Username", cell: (item: any) => item.username },
                      { id: "groups", header: "Groups", cell: (item: any) => item.groups || "-" },
                    ]}
                    onDelete={(item: any) => deleteUser.mutate({ brokerId: selectedBrokerId, username: item.username })}
                  />
                )}
              </SpaceBetween>
            ),
          },
        ]}
      />

      {/* Create Broker Modal */}
      <Modal visible={showCreateBroker} onDismiss={() => setShowCreateBroker(false)} header="Create Broker">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Broker Name"><Input value={brokerForm.brokerName} onChange={(e) => setBrokerForm({ ...brokerForm, brokerName: e.detail.value })} /></FormField>
            <FormField label="Engine">
              <Select selectedOption={ENGINE_OPTIONS.find((o) => o.value === brokerForm.engineType) || ENGINE_OPTIONS[0]} options={ENGINE_OPTIONS} onChange={(e) => setBrokerForm({ ...brokerForm, engineType: e.detail.selectedOption.value || "ActiveMQ" })} />
            </FormField>
            <FormField label="Instance Type">
              <Select selectedOption={INSTANCE_OPTIONS.find((o) => o.value === brokerForm.hostInstanceType) || INSTANCE_OPTIONS[0]} options={INSTANCE_OPTIONS} onChange={(e) => setBrokerForm({ ...brokerForm, hostInstanceType: e.detail.selectedOption.value || "mq.t2.micro" })} />
            </FormField>
            <Button onClick={handleCreateBroker} disabled={!brokerForm.brokerName || createBroker.isPending}>Create</Button>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal visible={showCreateUser} onDismiss={() => setShowCreateUser(false)} header="Create User">
        <Form>
          <SpaceBetween size="m">
            <FormField label="Username"><Input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.detail.value })} /></FormField>
            <FormField label="Password"><Input value={userForm.password} type="password" onChange={(e) => setUserForm({ ...userForm, password: e.detail.value })} /></FormField>
            <Button onClick={handleCreateUser} disabled={!userForm.username || !userForm.password || createUser.isPending}>Create</Button>
          </SpaceBetween>
        </Form>
      </Modal>
    </>
  );
}
// @v8 ignore end
