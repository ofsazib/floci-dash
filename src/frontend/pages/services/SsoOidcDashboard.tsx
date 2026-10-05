import { useState } from "react";
// V8 remaps phantom branches onto the multi-line import; no executable code here.
/* v8 ignore start */
import {
  Button,
  Container,
  Header,
  SpaceBetween,
  Box,
  FormField,
  Input,
  Alert,
  CopyToClipboard,
} from "@cloudscape-design/components";
/* v8 ignore stop */
import {
  useSoRegisterClient,
  useSoStartDeviceAuthorization,
  useSoCreateToken,
  type SoClient,
  type SoDeviceAuthorization,
  type SoToken,
} from "../../hooks/useSsoOidc";

interface Status {
  type: "success" | "error";
  message: string;
}

function StatusAlert({ status, onDismiss }: { status: Status | null; onDismiss: () => void }) {
  if (!status) return null;
  return (
    <Alert type={status.type} dismissible onDismiss={onDismiss}>
      {status.message}
    </Alert>
  );
}

export default function SsoOidcDashboard() {
  const registerClient = useSoRegisterClient();
  const startDeviceAuth = useSoStartDeviceAuthorization();
  const createToken = useSoCreateToken();

  const [status, setStatus] = useState<Status | null>(null);
  const [clientName, setClientName] = useState("");
  const [client, setClient] = useState<SoClient | null>(null);
  const [startUrl, setStartUrl] = useState("");
  const [deviceAuth, setDeviceAuth] = useState<SoDeviceAuthorization | null>(null);
  const [token, setToken] = useState<SoToken | null>(null);
  const [pending, setPending] = useState(false);

  async function wrap(action: () => Promise<unknown>, success: string) {
    setStatus(null);
    try {
      await action();
      setStatus({ type: "success", message: success });
    } catch (err) {
      setStatus({ type: "error", message: (err as Error)?.message || "Request failed" });
    }
  }

  return (
    <SpaceBetween size="l">
      <StatusAlert status={status} onDismiss={() => setStatus(null)} />
      <Container header={<Header variant="h3">1 — Register a public client</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Client name">
              <Input value={clientName} onChange={({ detail }) => setClientName(detail.value)} placeholder="my-cli" />
            </FormField>
            <Button
              disabled={!clientName}
              loading={registerClient.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await registerClient.mutateAsync({ clientName });
                    setClient(result);
                    setDeviceAuth(null);
                    setToken(null);
                  },
                  `Client ${clientName} registered.`
                )
              }
            >
              Register
            </Button>
          </SpaceBetween>
          {client && (
            <SpaceBetween size="xs">
              <Box>Client ID: {client.clientId}</Box>
              <CopyToClipboard
                copyButtonAriaLabel="Copy client secret"
                copyErrorText="Secret failed to copy"
                copySuccessText="Secret copied."
                textToCopy={client.clientSecret}
              />
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">2 — Start device authorization</Header>}>
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <FormField label="Start URL">
              <Input value={startUrl} onChange={({ detail }) => setStartUrl(detail.value)} placeholder="https://view.awsapps.com/start" />
            </FormField>
            <Button
              disabled={!client}
              loading={startDeviceAuth.isPending}
              onClick={() =>
                wrap(
                  async () => {
                    const result = await startDeviceAuth.mutateAsync({
                      clientId: client!.clientId,
                      clientSecret: client!.clientSecret,
                      startUrl: startUrl || undefined,
                    });
                    setDeviceAuth(result);
                    setToken(null);
                    setPending(false);
                  },
                  "Device authorization started."
                )
              }
            >
              Start
            </Button>
          </SpaceBetween>
          {deviceAuth && (
            <SpaceBetween size="xs">
              <Box>User code: {deviceAuth.userCode}</Box>
              {deviceAuth.verificationUriComplete && (
                <Box>
                  Approve at:{" "}
                  <a href={deviceAuth.verificationUriComplete} target="_blank" rel="noreferrer">
                    {deviceAuth.verificationUriComplete}
                  </a>
                </Box>
              )}
              <Box>Expires in: {deviceAuth.expiresIn}s (poll every {deviceAuth.interval}s)</Box>
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h3">3 — Poll for the token</Header>}>
        <SpaceBetween size="m">
          <Button
            disabled={!deviceAuth}
            loading={createToken.isPending}
            onClick={() =>
              wrap(
                async () => {
                  try {
                    const result = await createToken.mutateAsync({
                      clientId: client!.clientId,
                      clientSecret: client!.clientSecret,
                      deviceCode: deviceAuth!.deviceCode,
                    });
                    setToken(result);
                    setPending(false);
                  } catch (err) {
                    if ((err as Error)?.name === "authorization_pending") {
                      setPending(true);
                      return;
                    }
                    throw err;
                  }
                },
                "Token received."
              )
            }
          >
            Check token
          </Button>
          {pending && (
            <Alert type="info">
              Authorization pending — approve the user code in Floci&apos;s SSO portal, then
              check again.
            </Alert>
          )}
          {token && token.accessToken && (
            <SpaceBetween size="xs">
              <Box>Token type: {token.tokenType}</Box>
              <Box>Expires in: {token.expiresIn}s</Box>
              <CopyToClipboard
                copyButtonAriaLabel="Copy access token"
                copyErrorText="Token failed to copy"
                copySuccessText="Token copied."
                textToCopy={token.accessToken}
              />
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
