// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Stub every child so App's route wiring renders without pulling in heavy
// Cloudscape pages or network calls. App.tsx itself (the Routes/Route tree) is
// what we're covering here.
vi.mock("./components/AppLayoutShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./components/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

import App from "./App";

describe("App", () => {
  it("mounts and renders the home route by default", () => {
    render(<App />);
    expect(screen.getByText("home-page")).toBeTruthy();
  });
});
