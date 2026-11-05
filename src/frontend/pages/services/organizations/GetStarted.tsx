import { Box, Button, ColumnLayout, Container, Header, SpaceBetween } from "@cloudscape-design/components";

const STEPS = [
  { title: "Add accounts", text: "Create member accounts in the organization." },
  { title: "Group accounts", text: "Organize accounts into organizational units (OUs) by workload or team." },
  { title: "Apply policies", text: "Attach policies such as SCPs to the root, OUs or accounts." },
  { title: "Enable services", text: "Let integrated services work across the organization." },
];

/** Landing page shown before an organization exists, laid out like the AWS console's. */
export default function GetStarted({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  return (
    <SpaceBetween size="l">
      <div className="fd-org-hero">
        <div className="fd-org-hero-text">
          <div className="fd-org-hero-category">Management &amp; Governance</div>
          <h1>AWS Organizations</h1>
          <p className="fd-org-hero-tagline">Central management for multiple AWS accounts</p>
          <p>Manage the accounts of your local Floci environment as one organization: group them, apply policies and consolidate administration.</p>
        </div>
        <div className="fd-org-hero-box">
          <Box variant="p">Create an organization to manage multiple AWS accounts.</Box>
          <Button variant="primary" onClick={onCreate} loading={creating}>Create an organization</Button>
          <Box variant="small" color="text-body-secondary">This creates an organization with all features enabled.</Box>
        </div>
      </div>
      <Container header={<Header variant="h2">How it works</Header>}>
        <ColumnLayout columns={4} variant="text-grid">
          {STEPS.map((s) => (
            <div key={s.title}>
              <Box variant="awsui-key-label">{s.title}</Box>
              <Box variant="p">{s.text}</Box>
            </div>
          ))}
        </ColumnLayout>
      </Container>
      <Container header={<Header variant="h2">Pricing</Header>}>
        <Box variant="p">There is no cost to use AWS Organizations.</Box>
      </Container>
    </SpaceBetween>
  );
}
