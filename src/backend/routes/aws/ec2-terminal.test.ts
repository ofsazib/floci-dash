import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ── Mock Node.js built-ins ─────────────────────────────────

const _nodeMock = vi.hoisted(() => {
  const mockHttpRequest = vi.fn();
  const mockNetConnect = vi.fn();
  return { mockHttpRequest, mockNetConnect };
});

vi.mock("node:http", () => ({
  default: { request: _nodeMock.mockHttpRequest },
  request: _nodeMock.mockHttpRequest,
}));

vi.mock("node:net", () => ({
  default: { connect: _nodeMock.mockNetConnect },
  connect: _nodeMock.mockNetConnect,
}));

// ── Mock ws ────────────────────────────────────────────────

const _wsMock = vi.hoisted(() => {
  const state = {
    wssOnHandler: null as ((event: string, handler: any) => void) | null,
    connectionHandler: null as ((ws: any, req: any) => void) | null,
    errorHandler: null as ((err: Error) => void) | null,
  };

  class MockWebSocketServer {
    on(event: string, handler: any) {
      if (event === "connection") {
        state.connectionHandler = handler;
      }
      if (event === "error") {
        state.errorHandler = handler;
      }
      state.wssOnHandler?.(event, handler);
    }
  }

  return { MockWebSocketServer, state };
});

vi.mock("ws", () => ({
  WebSocketServer: _wsMock.MockWebSocketServer,
  WebSocket: { OPEN: 1, CONNECTING: 0, CLOSING: 2, CLOSED: 3 },
}));

let mockWs: any;

function createMockWs() {
  const handlerArrays: Record<string, Array<(...args: any[]) => void>> = {};
  const handlers: Record<string, (...args: any[]) => void> = {};
  mockWs = {
    readyState: 1,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      if (!handlerArrays[event]) handlerArrays[event] = [];
      handlerArrays[event].push(handler);
      handlers[event] = (...args: any[]) =>
        handlerArrays[event].forEach((h) => h(...args));
    }),
    _handlers: handlers,
    _trigger: (event: string, ...args: any[]) => {
      handlerArrays[event]?.forEach((h) => h(...args));
    },
  };
  return mockWs;
}

import { setupTerminalWebSocket } from "./ec2-terminal";

// ── Helpers ────────────────────────────────────────────────

function createMockRes(body: string) {
  const chunks: Buffer[] = [];
  const listeners: Record<string, (chunk?: any) => void> = {};
  return {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      listeners[event] = handler;
    }),
    _emit: () => {
      listeners.data?.(Buffer.from(body));
      listeners.end?.();
    },
  };
}

function createMockReq() {
  const listeners: Record<string, (err?: Error) => void> = {};
  return {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      listeners[event] = handler;
    }),
    write: vi.fn(),
    end: vi.fn(),
    _emitError: (err: Error) => listeners.error?.(err),
  };
}

function createMockSocket() {
  const listeners: Record<string, (chunk?: any) => void> = {};
  return {
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      listeners[event] = handler;
    }),
    write: vi.fn(),
    destroy: vi.fn(),
    _emitData: (data: string | Buffer) => listeners.data?.(Buffer.isBuffer(data) ? data : Buffer.from(data)),
    _emitEnd: () => listeners.end?.(),
    _emitError: (err: Error) => listeners.error?.(err),
  };
}

function createMockHttpServer() {
  return { on: vi.fn() } as any;
}

const validUrl = "/api/aws/ec2/instances/i-0abc123/terminal";
const invalidUrl = "/api/aws/ec2/instances/i-0abc123/other";

beforeEach(() => {
  vi.clearAllMocks();
  _wsMock.state.connectionHandler = null;
  _wsMock.state.wssOnHandler = null;
  _wsMock.state.errorHandler = null;
  mockWs = null;
  _nodeMock.mockHttpRequest.mockReset();
  _nodeMock.mockNetConnect.mockReset();
});

// ── Tests ──────────────────────────────────────────────────

describe("EC2 Terminal WebSocket", () => {
  it("rejects connections with invalid path", () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    expect(_wsMock.state.connectionHandler).toBeDefined();

    const ws = createMockWs();
    const req = { url: invalidUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    expect(ws.close).toHaveBeenCalledWith(4000, "Invalid path");
  });

  it("handles dockerHttpPost failure (no exec ID)", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const mockRes = createMockRes(JSON.stringify({}));
    const mockReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(mockRes);
      return mockReq;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    mockRes._emit();

    // Wait for promise microtask
    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
      const sendCall = ws.send.mock.calls[0][0];
      expect(sendCall).toContain("Error");
    });
  });

  it("handles dockerExecTty success and sends welcome message", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    // Mock dockerHttpPost (exec creation)
    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    // Mock net.connect (exec start)
    const mockSocket = createMockSocket();
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      // Call connect callback if provided
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    // Emit the exec creation response
    createRes._emit();

    // Wait for connection callback
    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    // Emit the HTTP response header end for the hijacked connection
    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));

    // Now the welcome message should be sent
    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
      const welcomeCall = ws.send.mock.calls.find((c: string[]) => c[0].includes("Connected"));
      expect(welcomeCall).toBeDefined();
    });

    // Test message forwarding from WebSocket to docker
    const wsDataMsg = Buffer.from("ls -la\n");
    const wsHandlers = ws._handlers;

    // Send a message from the WebSocket client
    wsHandlers.message?.(wsDataMsg);
    expect(mockSocket.write).toHaveBeenCalledWith(wsDataMsg);

    // Send output from docker to WebSocket
    const dockerOutput = Buffer.from("file1.txt\nfile2.txt\n");
    mockSocket._emitData(dockerOutput);
    expect(ws.send).toHaveBeenCalledWith(dockerOutput);

    // Test resize message
    const resizeMsg = JSON.stringify({ type: "resize", cols: 80, rows: 24 });
    wsHandlers.message?.(Buffer.from(resizeMsg));
    // Should trigger another POST to resize endpoint
    await vi.waitFor(() => {
      expect(_nodeMock.mockHttpRequest).toHaveBeenCalled();
    });

    // Test socket end triggers session ended message
    mockSocket._emitEnd();
    await vi.waitFor(() => {
      const endCalls = ws.send.mock.calls.filter((c: string[]) => c[0].includes("ended") || c[0].includes("Session ended"));
      if (endCalls.length === 0) {
        // It might close first
        expect(ws.close).toHaveBeenCalled();
      }
    });
  });

  it("handles docker socket error", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    const mockSocket = createMockSocket();
    const socketError = new Error("Connection refused");
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    createRes._emit();

    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
    });

    // Now trigger a socket error
    mockSocket._emitError(socketError);

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
      const errCalls = ws.send.mock.calls.filter((c: string[]) => c[0].includes("Error"));
      expect(errCalls.length).toBeGreaterThan(0);
    });
  });

  it("handles http.request error", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const mockReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation(() => mockReq);

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    // Trigger HTTP request error
    mockReq._emitError(new Error("HTTP request failed"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
      const errCalls = ws.send.mock.calls.filter((c: string[]) => c[0].includes("Error"));
      expect(errCalls.length).toBeGreaterThan(0);
    });
  });

  it("handles idle timeout", async () => {
    vi.useFakeTimers();
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    const mockSocket = createMockSocket();
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    createRes._emit();

    // Wait for connection
    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
    });

    // Fast-forward past idle timeout (30 min)
    vi.advanceTimersByTime(30 * 60 * 1000);

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining("timed out")
      );
    });

    vi.useRealTimers();
  });

  it("handles non-JSON WebSocket messages as terminal input", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    const mockSocket = createMockSocket();
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    createRes._emit();

    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
    });

    // Send a valid JSON that is NOT a resize message (should be treated as terminal input)
    const jsonBuf = Buffer.from('{"some":"json"}');
    const wsHandlers = ws._handlers;
    mockSocket.write.mockClear();

    wsHandlers.message?.(jsonBuf);
    expect(mockSocket.write).toHaveBeenCalledWith(jsonBuf);

    // Send invalid JSON (broken)
    mockSocket.write.mockClear();
    wsHandlers.message?.(Buffer.from("not json { broken"));
    expect(mockSocket.write).toHaveBeenCalled(); // treated as terminal input
  });

  it("handles WebSocket close event", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    const mockSocket = createMockSocket();
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    createRes._emit();

    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\n\r\n"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
    });

    // Trigger WebSocket close
    ws._trigger("close");

    // Socket should be destroyed
    expect(mockSocket.destroy).toHaveBeenCalled();
    expect(ws.close).toHaveBeenCalled();
  });

  it("handles WebSocket server error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    // The wss "error" handler was registered during setupTerminalWebSocket
    expect(_wsMock.state.errorHandler).toBeDefined();

    // Trigger the error
    _wsMock.state.errorHandler!(new Error("test error"));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("WebSocket server error"),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("sends message from docker to websocket before headers parsed", async () => {
    const server = createMockHttpServer();
    setupTerminalWebSocket(server);

    const createRes = createMockRes(JSON.stringify({ Id: "exec-123" }));
    const createReq = createMockReq();
    _nodeMock.mockHttpRequest.mockImplementation((_opts: any, cb: (res: any) => void) => {
      cb(createRes);
      return createReq;
    });

    const mockSocket = createMockSocket();
    _nodeMock.mockNetConnect.mockImplementation((_path: string, cb?: () => void) => {
      if (cb) setTimeout(cb, 0);
      return mockSocket;
    });

    const ws = createMockWs();
    const req = { url: validUrl, headers: { host: "localhost" } };
    _wsMock.state.connectionHandler!(ws, req);

    createRes._emit();

    await vi.waitFor(() => {
      expect(mockSocket.write).toHaveBeenCalled();
    });

    // Send data BEFORE headers are parsed — should buffer
    // HTTP response with headers + body
    mockSocket._emitData(Buffer.from("HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n"));

    await vi.waitFor(() => {
      expect(ws.send).toHaveBeenCalled();
    });
  });
});
