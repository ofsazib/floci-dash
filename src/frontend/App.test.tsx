// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Trackable mocks for Toast showToast and error reporter callback
const toastMocks = { showToast: vi.fn() };
let capturedReporter: ((message: string, context?: string) => void) | null = null;

vi.mock("./components/AppLayoutShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./components/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({
    showToast: toastMocks.showToast,
    toasts: [],
  }),
}));

// Factories are hoisted above imports, so each must be fully self-contained.
vi.mock("./pages/DashboardHome", () => ({ default: () => <div>home-page</div> }));
vi.mock("./pages/ServicePage", () => ({ default: () => <div>service-page</div> }));
vi.mock("./pages/S3Page", () => ({ default: () => <div>s3-page</div> }));
vi.mock("./pages/EC2Page", () => ({ default: () => <div>ec2-page</div> }));
vi.mock("./pages/SQSPage", () => ({ default: () => <div>sqs-page</div> }));
vi.mock("./pages/SNSPage", () => ({ default: () => <div>sns-page</div> }));
vi.mock("./pages/EventsPage", () => ({ default: () => <div>events-page</div> }));
vi.mock("./pages/LambdaPage", () => ({ default: () => <div>lambda-page</div> }));
vi.mock("./pages/CloudWatchPage", () => ({ default: () => <div>cw-page</div> }));
vi.mock("./pages/IAMPage", () => ({ default: () => <div>iam-page</div> }));
vi.mock("./pages/SecretsManagerPage", () => ({ default: () => <div>secrets-page</div> }));
vi.mock("./pages/CloudFormationPage", () => ({ default: () => <div>cfn-page</div> }));
vi.mock("./pages/KMSPage", () => ({ default: () => <div>kms-page</div> }));
vi.mock("./pages/Settings", () => ({ default: () => <div>settings-page</div> }));
vi.mock("./lib/globalErrorHandler", () => ({
  setGlobalErrorReporter: vi.fn((fn: any) => {
    capturedReporter = fn;
  }),
  clearGlobalErrorReporter: vi.fn(),
}));

import App from "./App";
import { setGlobalErrorReporter, clearGlobalErrorReporter } from "./lib/globalErrorHandler";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset hash so each test starts at the root
  window.location.hash = "";
  capturedReporter = null;
});

afterEach(() => {
  cleanup();
});

describe("App — home route", () => {
  it("mounts and renders the home route by default", () => {
    render(<App />);
    expect(screen.getByText("home-page")).toBeTruthy();
  });
});

describe("App — route navigation", () => {
  it("navigates to /settings route", async () => {
    window.location.hash = "#/settings";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("settings-page")).toBeTruthy();
    });
  });

  it("navigates to /services/s3 route", async () => {
    window.location.hash = "#/services/s3";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("s3-page")).toBeTruthy();
    });
  });

  it("navigates to /services/ec2 route", async () => {
    window.location.hash = "#/services/ec2";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("ec2-page")).toBeTruthy();
    });
  });

  it("navigates to /services/kms route", async () => {
    window.location.hash = "#/services/kms";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("kms-page")).toBeTruthy();
    });
  });

  it("navigates to /services/cloudwatch route", async () => {
    window.location.hash = "#/services/cloudwatch";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("cw-page")).toBeTruthy();
    });
  });

  it("navigates to /services/sqs route", async () => {
    window.location.hash = "#/services/sqs";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("sqs-page")).toBeTruthy();
    });
  });

  it("navigates to /services/lambda route", async () => {
    window.location.hash = "#/services/lambda";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("lambda-page")).toBeTruthy();
    });
  });

  it("navigates to /services/iam route", async () => {
    window.location.hash = "#/services/iam";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("iam-page")).toBeTruthy();
    });
  });

  it("uses ServicePage for unknown services", async () => {
    window.location.hash = "#/services/sns";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("sns-page")).toBeTruthy();
    });
  });

  it("uses ServicePage for generic /services/:service route", async () => {
    window.location.hash = "#/services/some-service";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("service-page")).toBeTruthy();
    });
  });
});

describe("App — ToastProviderWithErrorReporter", () => {
  it("calls setGlobalErrorReporter on mount", async () => {
    render(<App />);
    await waitFor(() => {
      expect(setGlobalErrorReporter).toHaveBeenCalled();
    });
  });

  it("calls clearGlobalErrorReporter on unmount", async () => {
    const { unmount } = render(<App />);
    unmount();
    expect(clearGlobalErrorReporter).toHaveBeenCalled();
  });

  it("shows toast with just message when reporter fires without context", async () => {
    render(<App />);
    await waitFor(() => {
      expect(capturedReporter).not.toBeNull();
    });
    capturedReporter!("Something went wrong");
    expect(toastMocks.showToast).toHaveBeenCalledWith("error", "Something went wrong");
  });

  it("shows toast with context prefix when reporter fires with context", async () => {
    render(<App />);
    await waitFor(() => {
      expect(capturedReporter).not.toBeNull();
    });
    capturedReporter!("Error message", "API");
    expect(toastMocks.showToast).toHaveBeenCalledWith("error", "[API] Error message");
  });
});

// ─── Additional missing routes ──────────────────────────────

describe("App — additional route navigation", () => {
  it("navigates to /services/events route", async () => {
    window.location.hash = "#/services/events";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("events-page")).toBeTruthy();
    });
  });

  it("navigates to /services/secretsmanager route", async () => {
    window.location.hash = "#/services/secretsmanager";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("secrets-page")).toBeTruthy();
    });
  });

  it("navigates to /services/cloudformation route", async () => {
    window.location.hash = "#/services/cloudformation";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("cfn-page")).toBeTruthy();
    });
  });

  it("navigates to /services/monitoring route (alias to CloudWatch)", async () => {
    window.location.hash = "#/services/monitoring";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("cw-page")).toBeTruthy();
    });
  });
});
