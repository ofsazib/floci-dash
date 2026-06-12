import { ContentLayout, Header, Container, Toggle, Select, SpaceBetween, Box } from "@cloudscape-design/components";
import { useSettings } from "../stores/settings";

export default function Settings() {
  const { darkMode, refreshInterval, toggleDarkMode, setRefreshInterval } = useSettings();

  const refreshLabel = refreshInterval === 5000 ? "5 seconds"
    : refreshInterval === 10000 ? "10 seconds"
    : refreshInterval === 30000 ? "30 seconds"
    : "Off";

  return (
    <ContentLayout header={<Header variant="h1">Settings</Header>}>
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Appearance</Header>}>
          <Toggle checked={darkMode} onChange={toggleDarkMode}>
            Dark mode
          </Toggle>
        </Container>

        <Container header={<Header variant="h2">Data Refresh</Header>}>
          <Select
            selectedOption={{
              value: String(refreshInterval),
              label: refreshLabel,
            }}
            options={[
              { value: "5000", label: "5 seconds" },
              { value: "10000", label: "10 seconds" },
              { value: "30000", label: "30 seconds" },
              { value: "0", label: "Off" },
            ]}
            onChange={({ detail }: { detail: { selectedOption: { value?: string } } }) =>
              setRefreshInterval(Number(detail.selectedOption.value))
            }
          />
        </Container>

        <Container header={<Header variant="h2">About</Header>}>
          <Box variant="p">Floci Dashboard v0.1.0</Box>
          <Box variant="p">AWS Console-style management interface for the Floci local AWS emulator.</Box>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}
