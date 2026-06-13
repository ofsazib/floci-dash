import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Box, Button, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";

interface EC2TerminalProps {
  instanceId: string;
  onClose: () => void;
}

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

function TerminalInner({ instanceId }: { instanceId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectedRef = useRef(false);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      theme: {
        background: "#0a1628",
        foreground: "#d5dbe8",
        cursor: "#94a0b8",
        selectionBackground: "#3b4a6b",
        black: "#1a2538",
        red: "#ef6b6b",
        green: "#6bcf7f",
        yellow: "#e7c56b",
        blue: "#6b9fef",
        magenta: "#c56bef",
        cyan: "#6bcfcf",
        white: "#d5dbe8",
        brightBlack: "#4a5a7a",
        brightRed: "#ef8b8b",
        brightGreen: "#8bdf9f",
        brightYellow: "#efd58b",
        brightBlue: "#8bbfef",
        brightMagenta: "#d58bef",
        brightCyan: "#8bdfdf",
        brightWhite: "#e5ebf5",
      },
      allowTransparency: false,
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalRef.current) {
      term.open(terminalRef.current);
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/aws/ec2/instances/${encodeURIComponent(instanceId)}/terminal`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      connectedRef.current = true;
      setState("connected");
      setTimeout(() => fitAddon.fit(), 100);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
      } else {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setState("error");
      setErrorMessage("WebSocket connection failed. Ensure the instance is running and try again.");
    };

    ws.onclose = (event) => {
      if (!connectedRef.current) {
        setState("error");
        setErrorMessage(
          event.code === 4000
            ? "Invalid instance ID."
            : `Connection closed (code ${event.code}). Instance may have been terminated.`
        );
      } else {
        setState("disconnected");
      }
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
        }
      } catch {
        // Ignore fit errors during unmount
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    window.addEventListener("resize", handleResize);

    setTimeout(() => term.focus(), 200);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      ws.close();
      term.dispose();
    };
  }, [instanceId]);

  const handleDisconnect = () => {
    wsRef.current?.close();
    // Let onclose handle state transition
  };

  return (
    <>
      <div
        style={{
          padding: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#0a1628",
          borderBottom: "1px solid #1a2538",
        }}
      >
        <Box color="text-status-info" fontSize="body-s" padding={{ left: "s" }}>
          {state === "connecting" && <StatusIndicator type="in-progress">Connecting to {instanceId}...</StatusIndicator>}
          {state === "connected" && <StatusIndicator type="success">Connected — {instanceId}</StatusIndicator>}
          {state === "disconnected" && <StatusIndicator type="warning">Disconnected</StatusIndicator>}
          {state === "error" && <StatusIndicator type="error">Connection failed</StatusIndicator>}
        </Box>
        <SpaceBetween direction="horizontal" size="xs">
          {state === "connected" && (
            <Button variant="inline-icon" iconName="undo" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
          <Button variant="inline-icon" iconName="close" onClick={() => { wsRef.current?.close(); }}>
            Close
          </Button>
        </SpaceBetween>
      </div>
      {state === "error" && errorMessage && (
        <Box color="text-status-error" padding="s" fontSize="body-s">
          {errorMessage}
        </Box>
      )}
      <div
        ref={terminalRef}
        style={{
          width: "100%",
          height: "450px",
          backgroundColor: "#0a1628",
        }}
      />
    </>
  );
}

export default function EC2Terminal({ instanceId, onClose }: EC2TerminalProps) {
  const [reconnectKey, setReconnectKey] = useState(0);

  const handleReconnect = () => {
    setReconnectKey(k => k + 1);
  };

  return (
    <Box>
      <SpaceBetween size="xs">
        <TerminalInner key={reconnectKey} instanceId={instanceId} />
        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
          <Button variant="normal" iconName="refresh" onClick={handleReconnect}>
            Reconnect
          </Button>
          <Button variant="normal" iconName="close" onClick={onClose}>
            Close Terminal
          </Button>
        </div>
      </SpaceBetween>
    </Box>
  );
}
