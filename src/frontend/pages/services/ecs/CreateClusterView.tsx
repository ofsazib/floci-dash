import { useState } from "react";
import { Box, Button, Container, ExpandableSection, Form, FormField, Header, Input, SpaceBetween, Tiles } from "@cloudscape-design/components";
import TagsEditor, { type TagRow } from "../../../components/TagsEditor";
import { useToast } from "../../../components/Toast";
import { useCreateECSCluster } from "../../../hooks/useECS";

const NAME_PATTERN = /^[A-Za-z0-9_-]{1,255}$/;

/** "Create cluster", laid out like the console page: configuration, infrastructure, monitoring, tags. */
export default function CreateClusterView({ onDone }: { onDone: () => void }) {
  const { showToast } = useToast();
  const createCluster = useCreateECSCluster();
  const [name, setName] = useState("");
  const [tags, setTags] = useState<TagRow[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const nameError = !NAME_PATTERN.test(name.trim())
    ? "Enter a valid cluster name: 1 to 255 letters, numbers, hyphens or underscores."
    : undefined;

  function create() {
    setSubmitted(true);
    if (nameError) return;
    const clusterName = name.trim();
    const rows = tags.filter((t) => t.key.trim()).map((t) => ({ key: t.key.trim(), value: t.value }));
    createCluster.mutate(
      { clusterName, ...(rows.length ? { tags: rows } : {}) },
      {
        onSuccess: () => {
          showToast("success", `Cluster ${clusterName} has been created successfully.`);
          onDone();
        },
        onError: (e) => showToast("error", (e as Error)?.message || "Failed to create cluster"),
      },
    );
  }

  return (
    <Form
      header={
        <Header
          variant="h1"
          description="An Amazon ECS cluster groups together tasks, and services, and allows for shared capacity and common configurations. All of your tasks, services, and capacity must belong to a cluster."
        >
          Create cluster
        </Header>
      }
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onDone}>Cancel</Button>
          <Button variant="primary" loading={createCluster.isPending} onClick={create}>Create</Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Cluster configuration</Header>}>
          <FormField
            label="Cluster name"
            constraintText="Cluster name must be 1 to 255 characters. Valid characters are a-z, A-Z, 0-9, hyphens (-), and underscores (_)."
            errorText={submitted ? nameError : undefined}
          >
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="Enter cluster name" ariaLabel="Cluster name" />
          </FormField>
        </Container>
        <ExpandableSection
          variant="container"
          defaultExpanded
          headerText="Infrastructure - advanced"
          headerDescription="Configure the manner of obtaining compute resources that will be used to host your application."
        >
          <FormField
            label="Select a method of obtaining compute capacity"
            description="Your cluster is automatically configured for AWS Fargate (serverless). Floci runs tasks as local containers."
          >
            <Tiles
              value="fargate"
              columns={3}
              items={[
                { value: "fargate", label: "Fargate only", description: "Serverless - you don't think about creating or managing servers. Great for most common workloads." },
                { value: "managed", label: "Fargate and Managed Instances", description: "Not available in Floci.", disabled: true },
                { value: "self-managed", label: "Fargate and Self-managed instances", description: "Not available in Floci.", disabled: true },
              ]}
            />
          </FormField>
        </ExpandableSection>
        <ExpandableSection
          variant="container"
          headerText="Monitoring - optional"
          headerDescription="Configure observability, encryption, and logging options to maintain compliance and operational visibility of your container environment."
        >
          <Box color="text-body-secondary">CloudWatch Container Insights can be turned on from Account settings (containerInsights).</Box>
        </ExpandableSection>
        <ExpandableSection variant="container" headerText="Tags - optional" headerDescription="Tags help you to identify and organize your clusters.">
          <TagsEditor tags={tags} onChange={setTags} />
        </ExpandableSection>
      </SpaceBetween>
    </Form>
  );
}
