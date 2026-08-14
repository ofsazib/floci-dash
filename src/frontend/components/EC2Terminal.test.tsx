// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";

let lastWs: any = null;
let termOnData: any = null;
const mockWrite = vi.fn();

const fitAddonState = vi.hoisted(() => ({ dims: { cols: 80, rows: 24 } as { cols: number; rows: number } | null }));

const mockTerminal = vi.hoisted(() => {
  class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    write = mockWrite;
    onData = vi.fn((fn: any) => { termOnData = fn; });
    focus = vi.fn();
    dispose = vi.fn();
    onResize = vi.fn();
  }
  return MockTerminal;
});

const mockFitAddon = vi.hoisted(() => {
  class MockFitAddon {
    fit = vi.fn();
    proposeDimensions = vi.fn(() => fitAddonState.dims);
  }
  return MockFitAddon;
});

vi.mock("@xterm/xterm", () => ({ Terminal: mockTerminal }));
vi.mock("@xterm/addon-fit", () => ({ FitAddon: mockFitAddon }));

import EC2Terminal from "./EC2Terminal";

function renderTerminal(instanceId = "i-123", onClose = vi.fn()) {
  const utils = render(React.createElement(EC2Terminal, { instanceId, onClose }));
  return { onClose, ...utils };
}

beforeEach(() => {
  lastWs = null;
  termOnData = null;
  fitAddonState.dims = { cols: 80, rows: 24 };
  mockWrite.mockReset();
  class MockWebSocket {
    static OPEN = 1;
    readyState = MockWebSocket.OPEN;
    binaryType = "";
    onopen: any = null;
    onmessage: any = null;
    onclose: any = null;
    onerror: any = null;
    send = vi.fn();
    close = vi.fn();
    url: string;
    constructor(url: string) {
      this.url = url;
      lastWs = this;
    }
  }
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("ResizeObserver", vi.fn(function MR() {
    return { observe: vi.fn(), disconnect: vi.fn() };
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EC2Terminal", () => {
  it("renders connecting state initially", () => {
    renderTerminal();
    expect(screen.getByText(/Connecting to/)).toBeTruthy();
    expect(screen.getByText("Reconnect")).toBeTruthy();
    expect(screen.getByText("Close Terminal")).toBeTruthy();
  });

  it("calls onClose when Close Terminal button clicked", () => {
    const onClose = vi.fn();
    renderTerminal("i-123", onClose);
    fireEvent.click(screen.getByText("Close Terminal"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows connected state when ws opens", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onopen) lastWs.onopen({});
    });
    await waitFor(() => expect(screen.getByText(/Connected/)).toBeTruthy());
  });

  it("shows disconnected when ws closes after connected", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onopen) lastWs.onopen({});
    });
    await act(async () => {
      if (lastWs && lastWs.onclose) lastWs.onclose({ code: 1000 });
    });
    await waitFor(() => expect(screen.getByText("Disconnected")).toBeTruthy());
  });

  it("shows error on ws error", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onerror) lastWs.onerror({});
    });
    await waitFor(() => expect(screen.getByText("Connection failed")).toBeTruthy());
    expect(screen.getByText(/WebSocket connection failed/)).toBeTruthy();
  });

  it("shows error on close before connecting", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onclose) lastWs.onclose({ code: 1000 });
    });
    await waitFor(() => expect(screen.getByText("Connection failed")).toBeTruthy());
  });

  it("shows invalid instance ID for code 4000", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onclose) lastWs.onclose({ code: 4000 });
    });
    await waitFor(() => expect(screen.getByText("Invalid instance ID.")).toBeTruthy());
  });

  it("writes string message to terminal", () => {
    renderTerminal();
    if (lastWs && lastWs.onmessage) lastWs.onmessage({ data: "hello" });
    expect(mockWrite).toHaveBeenCalledWith("hello");
  });

  it("writes binary message as Uint8Array", () => {
    renderTerminal();
    if (lastWs && lastWs.onmessage) lastWs.onmessage({ data: new ArrayBuffer(4) });
    expect(mockWrite).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  it("forwards user input via WebSocket", () => {
    renderTerminal();
    if (lastWs && lastWs.onopen) lastWs.onopen({});
    termOnData("ls\n");
    expect(lastWs.send).toHaveBeenCalledWith("ls\n");
  });

  it("reconnect triggers re-render and creates new ws", async () => {
    const firstWs: any = {};
    lastWs = firstWs;
    renderTerminal();
    await act(async () => {
      fireEvent.click(screen.getByText("Reconnect"));
    });
    expect(lastWs).not.toBe(firstWs);
  });

  it("sends a resize message when the window resizes", () => {
    renderTerminal();
    fireEvent(window, new Event("resize"));
    expect(lastWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "resize", cols: 80, rows: 24 }),
    );
  });

  it("handles resize through the ResizeObserver callback", () => {
    renderTerminal();
    const ResizeObserverCtor = (globalThis as any).ResizeObserver;
    const cb = ResizeObserverCtor.mock.calls[0][0];
    cb([{ contentRect: { width: 100, height: 50 } }]);
    expect(lastWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "resize", cols: 80, rows: 24 }),
    );
  });

  it("runs the post-connect fit and focus timers", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onopen) lastWs.onopen({});
    });
    await new Promise((r) => setTimeout(r, 250));
  });

  it("disconnects via the Disconnect button", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onopen) lastWs.onopen({});
    });
    await waitFor(() => expect(screen.getByText(/Connected —/)).toBeTruthy());
    // Inline-icon buttons have no accessible name — first header button is Disconnect
    const btns = screen.getAllByRole("button");
    fireEvent.click(btns[0]);
    expect(lastWs.close).toHaveBeenCalled();
  });

  it("closes the websocket via the connected header Close button", async () => {
    renderTerminal();
    await act(async () => {
      if (lastWs && lastWs.onopen) lastWs.onopen({});
    });
    await waitFor(() => expect(screen.getByText(/Connected —/)).toBeTruthy());
    // Inline-icon buttons have no accessible name — second header button is Close
    const btns = screen.getAllByRole("button");
    fireEvent.click(btns[1]);
    expect(lastWs.close).toHaveBeenCalled();
  });

  it("uses wss protocol when the page is served over https", () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, protocol: "https:" },
      configurable: true,
    });
    try {
      renderTerminal();
    } finally {
      Object.defineProperty(window, "location", { value: original, configurable: true });
    }
    expect(lastWs.url).toMatch(/^wss:\/\//);
  });

  it("does not forward input when the socket is not open", () => {
    renderTerminal();
    lastWs.readyState = 0; // CONNECTING
    termOnData("ls\n");
    expect(lastWs.send).not.toHaveBeenCalled();
  });

  it("does not send a resize message when dimensions are unavailable", () => {
    fitAddonState.dims = null;
    renderTerminal();
    fireEvent(window, new Event("resize"));
    expect(lastWs.send).not.toHaveBeenCalled();
  });
});
