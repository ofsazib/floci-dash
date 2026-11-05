import { useState } from "react";
import { Box, Button, Container, Form, FormField, Header, Input, SpaceBetween, Tiles } from "@cloudscape-design/components";
import { useCreateOrgAccount } from "../../../hooks/useOrganizations";
import { useToast } from "../../../components/Toast";
import TagsEditor, { tagsToRecord, type TagRow } from "../../../components/TagsEditor";

const DEFAULT_ROLE = "OrganizationAccountAccessRole";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Add an AWS account" page (create flow), laid out like the AWS console's. */
export default function AddAccountView({ onDone }: { onDone: () => void }) {
  const { showToast } = useToast();
  const createAccount = useCreateOrgAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState(DEFAULT_ROLE);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? "Enter an AWS account name." : undefined;
  const emailError = submitted && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined;

  async function submit() {
    setSubmitted(true);
    if (!name.trim() || !EMAIL_RE.test(email.trim())) return;
    try {
      await createAccount.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        roleName: roleName.trim() || DEFAULT_ROLE,
        tags: tagsToRecord(tags),
      });
      showToast("success", `Creating the AWS account '${name.trim()}'. It appears in the root of the organization.`);
      onDone();
    } catch (e) {
      showToast("error", (e as Error)?.message || "Failed to create account");
    }
  }

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="You can add an AWS account to your organization either by creating an account or by inviting an existing AWS account to join your organization.">
        Add an AWS account
      </Header>
      <Tiles
        value="create"
        ariaLabel="How to add the account"
        items={[
          { value: "create", label: "Create an AWS account", description: "Create an AWS account that is added to your organization." },
          { value: "invite", label: "Invite an existing AWS account", description: "Not available in this dashboard yet.", disabled: true },
        ]}
      />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" variant="link" onClick={onDone}>Cancel</Button>
              <Button variant="primary" loading={createAccount.isPending}>Create AWS account</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            <Container header={<Header variant="h2">Create an AWS account</Header>}>
              <SpaceBetween size="l">
                <FormField label="AWS account name" errorText={nameError}>
                  <Input value={name} onChange={({ detail }) => setName(detail.value)} ariaLabel="AWS account name" />
                </FormField>
                <FormField label="Email address of the account's owner" errorText={emailError}>
                  <Input type="email" value={email} onChange={({ detail }) => setEmail(detail.value)} ariaLabel="Email address of the account's owner" />
                </FormField>
                <FormField label="IAM role name" description="The management account can use this IAM role to access resources in the member account.">
                  <Input value={roleName} onChange={({ detail }) => setRoleName(detail.value)} ariaLabel="IAM role name" />
                </FormField>
              </SpaceBetween>
            </Container>
            <Container header={<Header variant="h2" description="Tags are key-value pairs that you can add to AWS resources to help identify, organize, and secure your AWS resources.">Tags</Header>}>
              <TagsEditor tags={tags} onChange={setTags} />
            </Container>
            <Box variant="small" color="text-body-secondary">New accounts are created in the root. Move them to an OU from the AWS accounts page.</Box>
          </SpaceBetween>
        </Form>
      </form>
    </SpaceBetween>
  );
}
