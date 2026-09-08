import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Textarea,
} from "@cloudscape-design/components";
import { useAuthorize, useConsent, useSignInToken } from "../../hooks/useSignIn";

const DEFAULT_AUTH_PARAMS =
  "client_id=local-cli&response_type=code&scope=aws&redirect_uri=http://localhost:8766/callback";

/** AWS Sign-In console — walks the OAuth authorize → consent → token flow. */
export default function SignInDashboard() {
  const authorize = useAuthorize();
  const consent = useConsent();
  const token = useSignInToken();

  const [authParams, setAuthParams] = useState(DEFAULT_AUTH_PARAMS);
  const [requestId, setRequestId] = useState("");
  const [tokenBody, setTokenBody] = useState(
    JSON.stringify({ grant_type: "authorization_code", code: "", redirect_uri: "" }, null, 2),
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const beginAuthorize = async () => {
    try {
      const params: Record<string, string> = {};
      new URLSearchParams(authParams).forEach((v, k) => {
        params[k] = v;
      });
      const res = await authorize.mutateAsync(params);
      const loc = res.location || "";
      const rid = new URLSearchParams(loc.split("?")[1] || "").get("request_id") || "";
      setRequestId(rid);
      setMessage(
        rid
          ? { type: "success", text: `Authorization started — request_id ${rid}` }
          : { type: "error", text: "Floci did not return a request_id" },
      );
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Authorize failed" });
    }
  };

  const decide = async (action: "continue" | "cancel") => {
    try {
      const res = await consent.mutateAsync({ requestId, action });
      setMessage({ type: "success", text: `Consent ${action} → ${res.location || "(no redirect)"}` });
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || `Consent ${action} failed` });
    }
  };

  const exchange = async () => {
    try {
      const parsed = JSON.parse(tokenBody);
      const res = await token.mutateAsync(parsed);
      setMessage({ type: "success", text: JSON.stringify(res, null, 2) });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e instanceof SyntaxError ? "Token body is not valid JSON" : e?.message || "Token exchange failed",
      });
    }
  };

  return (
    <Box>
      <SpaceBetween direction="vertical" size="l">
        <Header variant="h2">AWS Sign-In (local OAuth)</Header>

        <FormField label="Authorize query params">
          <Input value={authParams} onChange={({ detail }) => setAuthParams(detail.value)} />
        </FormField>
        <Button variant="primary" onClick={beginAuthorize} loading={authorize.isPending}>
          Begin authorization
        </Button>

        <FormField label="Request ID">
          <Input value={requestId} onChange={({ detail }) => setRequestId(detail.value)} />
        </FormField>
        <SpaceBetween direction="horizontal" size="s">
          <Button onClick={() => decide("continue")} disabled={!requestId} loading={consent.isPending}>
            Approve
          </Button>
          <Button onClick={() => decide("cancel")} disabled={!requestId} loading={consent.isPending}>
            Deny
          </Button>
        </SpaceBetween>

        <FormField label="Token exchange body (JSON)">
          <Textarea value={tokenBody} onChange={({ detail }) => setTokenBody(detail.value)} rows={6} />
        </FormField>
        <Button variant="primary" onClick={exchange} loading={token.isPending}>
          Exchange token
        </Button>

        {message && (
          <Alert type={message.type} dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </SpaceBetween>
    </Box>
  );
}
