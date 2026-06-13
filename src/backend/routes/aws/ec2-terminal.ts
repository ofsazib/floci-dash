import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import http from "node:http";
import net from "node:net";

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";

function dockerHttpPost(
  path: string,
  body: Record<string, unknown>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: DOCKER_SOCKET,
        path,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function dockerExecTty(
  containerName: string,
  cmd: string[],
  onOutput: (data: Buffer) => void,
  onExit: () => void,
  onError: (err: Error) => void
): Promise<{ write: (data: Buffer) => void; kill: () => void; resize: (cols: number, rows: number) => void }> {
  // Step 1: Create exec instance with Tty=true
  const createRes = await dockerHttpPost(`/containers/${containerName}/exec`, {
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Detach: false,
    Tty: true,
    Cmd: cmd,
  });

  const execId = JSON.parse(createRes).Id;
  if (!execId) throw new Error("Failed to create exec instance");

  // Step 2: Start exec via raw TCP socket for bidirectional hijacked connection
  return new Promise((resolve, reject) => {
    const socket = net.connect(DOCKER_SOCKET, () => {
      const startBody = JSON.stringify({ Detach: false, Tty: true });
      const req =
        `POST /exec/${execId}/start HTTP/1.1\r\n` +
        `Host: localhost\r\n` +
        `Content-Type: application/json\r\n` +
        `Content-Length: ${Buffer.byteLength(startBody)}\r\n` +
        `Connection: Upgrade\r\n` +
        `Upgrade: tcp\r\n` +
        `\r\n` +
        startBody;

      socket.write(req);
    });

    let headersParsed = false;
    let headerBuf = Buffer.alloc(0);
    let closed = false;

    socket.on("data", (chunk: Buffer) => {
      if (!headersParsed) {
        headerBuf = Buffer.concat([headerBuf, chunk]);
        const idx = headerBuf.indexOf("\r\n\r\n");
        if (idx >= 0) {
          headersParsed = true;
          const remaining = headerBuf.subarray(idx + 4);
          if (remaining.length > 0) onOutput(remaining);
        }
        return;
      }
      onOutput(chunk);
    });

    socket.on("end", () => {
      if (!closed) {
        closed = true;
        onExit();
      }
    });

    socket.on("error", (err) => {
      if (!closed) {
        closed = true;
        onError(err);
      }
    });

    resolve({
      write: (data: Buffer) => {
        if (closed) return;
        try { socket.write(data); } catch { /* ignore */ }
      },
      kill: () => {
        closed = true;
        try { socket.destroy(); } catch { /* ignore */ }
      },
      resize: (cols: number, rows: number) => {
        if (closed) return;
        // Use the exec resize API to set TTY size
        dockerHttpPost(`/exec/${execId}/resize?h=${rows}&w=${cols}`, {}).catch(() => {});
      },
    });
  });
}

function getContainerName(instanceId: string): string {
  return `floci-ec2-${instanceId}`;
}

export function setupTerminalWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);

    const match = url.pathname.match(
      /^\/api\/aws\/ec2\/instances\/([^/]+)\/terminal$/
    );
    if (!match) {
      ws.close(4000, "Invalid path");
      return;
    }

    const instanceId = decodeURIComponent(match[1]);
    const containerName = getContainerName(instanceId);

    let closed = false;
    let proc: Awaited<ReturnType<typeof dockerExecTty>> | null = null;

    const close = () => {
      if (closed) return;
      closed = true;
      proc?.kill();
      ws.close();
    };

    dockerExecTty(
      containerName,
      ["/bin/bash"],
      (data: Buffer) => {
        try {
          if (ws.readyState === WebSocket.OPEN) ws.send(data);
        } catch { /* ignore */ }
      },
      () => {
        if (!closed) {
          try { ws.send("\r\n\x1b[33mSession ended.\x1b[0m\r\n"); } catch { /* ignore */ }
          close();
        }
      },
      (err: Error) => {
        if (!closed) {
          try { ws.send(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`); } catch { /* ignore */ }
          close();
        }
      }
    )
      .then((p) => {
        proc = p;

        ws.on("message", (data: Buffer | string) => {
          const raw = typeof data === "string" ? Buffer.from(data) : data;

          // Check for resize JSON
          if (raw[0] === 0x7b /* '{' */) {
            try {
              const msg = JSON.parse(raw.toString());
              if (msg.type === "resize" && msg.cols && msg.rows) {
                proc?.resize(msg.cols, msg.rows);
                return;
              }
            } catch {
              // Not valid JSON, treat as terminal input
            }
          }

          proc?.write(raw);
        });

        // Idle timeout
        let idleTimer: NodeJS.Timeout | null = null;
        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            try { ws.send("\r\n\x1b[33mSession timed out (30 min limit).\x1b[0m\r\n"); } catch { /* ignore */ }
            close();
          }, 30 * 60 * 1000);
        };
        ws.on("message", resetIdle);
        resetIdle();

        ws.on("close", close);
        ws.on("error", close);

        ws.send(
          `\r\n\x1b[32mConnected to ${containerName}\x1b[0m\r\n` +
          `\x1b[32mType "exit" to disconnect.\x1b[0m\r\n\r\n`
        );
      })
      .catch((err) => {
        if (!closed) {
          try { ws.send(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`); } catch { /* ignore */ }
          close();
        }
      });
  });

  wss.on("error", (err: Error) => {
    console.error("WebSocket server error:", err);
  });
}
