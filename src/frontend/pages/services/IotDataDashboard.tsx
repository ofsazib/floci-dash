import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  SpaceBetween,
  Tabs,
  Textarea,
} from "@cloudscape-design/components";
import {
  useIotShadow,
  useIotUpdateShadow,
  useIotDeleteShadow,
  useIotNamedShadows,
  useIotPublish,
} from "../../hooks/useIotData";
import { useToast } from "../../components/Toast";
import ResourceTable from "../../components/ResourceTable";
import DeleteButton from "../../components/DeleteButton";

function ShadowsTab() {
  const { showToast } = useToast();
  const [thingName, setThingName] = useState("");
  const [activeThing, setActiveThing] = useState("");
  const { data, isLoading, error } = useIotShadow(activeThing);
  const named = useIotNamedShadows(activeThing);
  const update = useIotUpdateShadow();
  const remove = useIotDeleteShadow();
  const [desiredText, setDesiredText] = useState("");

  const doLoad = async () => {
    setActiveThing(thingName.trim());
  };

  const doUpdate = async () => {
    try {
      await update.mutateAsync({ thingName: activeThing!, payload: desiredText });
      showToast("success", "Shadow updated");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to update shadow");
    }
  };

  const doDelete = async () => {
    try {
      await remove.mutateAsync(activeThing!);
      showToast("success", "Shadow deleted");
    } catch (e: any) {
      showToast("error", e?.message || "Failed to delete shadow");
    }
  };

  const shadows: any[] = named.data?.shadows || [];

  return (
    <SpaceBetween size="l">
      <FormField label="Thing name">
        <SpaceBetween size="xs" direction="horizontal">
          <Input
            value={thingName}
            onChange={({ detail }) => setThingName(detail.value)}
            placeholder="my-thing"
          />
          <Button variant="primary" disabled={!thingName.trim()} onClick={doLoad}>
            Load shadow
          </Button>
        </SpaceBetween>
      </FormField>

      {activeThing ? (
        <SpaceBetween size="m">
          <Box>
            Current shadow:{" "}
            {error ? (
              "unavailable"
            ) : (
              <Box>
                <pre>{data?.payload ? JSON.stringify(data.payload, null, 2) : "no shadow"}</pre>
              </Box>
            )}
          </Box>
          <FormField label="Desired state (JSON)">
            <Textarea
              value={desiredText}
              onChange={({ detail }) => setDesiredText(detail.value)}
              rows={5}
              placeholder='{"state": {"desired": {"power": "on"}}}'
            />
          </FormField>
          <SpaceBetween size="xs" direction="horizontal">
            <Button
              variant="primary"
              onClick={doUpdate}
              disabled={!desiredText.trim() || update.isPending}
            >
              Update shadow
            </Button>
            <Button onClick={doDelete}>Delete shadow</Button>
          </SpaceBetween>
          <ResourceTable
            resourceName="named shadow"
            loading={named.isLoading}
            items={shadows}
            columns={[
              { id: "name", header: "Name", cell: (s: any) => s.name || "—" },
              { id: "timestamp", header: "Timestamp", cell: (s: any) => String(s.timestamp ?? "—") },
            ]}
          />
        </SpaceBetween>
      ) : null}
    </SpaceBetween>
  );
}

function PublishTab() {
  const { showToast } = useToast();
  const publish = useIotPublish();
  const [topic, setTopic] = useState("");
  const [payloadText, setPayloadText] = useState("");

  const doPublish = async () => {
    try {
      await publish.mutateAsync({ topic: topic.trim(), payload: payloadText });
      showToast("success", `Published to ${topic.trim()}`);
    } catch (e: any) {
      showToast("error", e?.message || "Failed to publish");
    }
  };

  return (
    <SpaceBetween size="m">
      <FormField label="Topic">
        <Input value={topic} onChange={({ detail }) => setTopic(detail.value)} placeholder="devices/lamp/state" />
      </FormField>
      <FormField label="Payload (JSON, optional)">
        <Textarea
          value={payloadText}
          onChange={({ detail }) => setPayloadText(detail.value)}
          rows={5}
          placeholder='{"on": true}'
        />
      </FormField>
      <Button variant="primary" disabled={!topic.trim()} onClick={doPublish} loading={publish.isPending}>
        Publish
      </Button>
    </SpaceBetween>
  );
}

export default function IotDataDashboard() {
  return (
    <Tabs
      tabs={[
        { id: "shadows", label: "Shadows", content: <ShadowsTab /> },
        { id: "publish", label: "Publish", content: <PublishTab /> },
      ]}
    />
  );
}
