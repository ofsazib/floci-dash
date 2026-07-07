// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Stub every child so App's route wiring renders without pulling in heavy
// Cloudscape pages or network calls. App.tsx itself (the Routes/Route tree) is
// what we're covering here.
vi.mock("./components/AppLayoutShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./components/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useToast: () => ({
    showToast: () => {},
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
  setGlobalErrorReporter: vi.fn(),
  clearGlobalErrorReporter: vi.fn(),
}));

import App from "./App";
import { setGlobalErrorReporter, clearGlobalErrorReporter } from "./lib/globalErrorHandler";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset hash so each test starts at the root
  window.location.hash = "";
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
});
