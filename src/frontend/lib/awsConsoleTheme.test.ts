import { describe, it, expect, vi } from "vitest";

const { mockApplyTheme } = vi.hoisted(() => ({ mockApplyTheme: vi.fn(() => ({ reset: vi.fn() })) }));
vi.mock("@cloudscape-design/components/theming", () => ({ applyTheme: mockApplyTheme }));

import { applyAwsConsoleTheme, AWS_CONSOLE_THEME, AWS_CONSOLE_COLORS } from "./awsConsoleTheme";

describe("awsConsoleTheme", () => {
  it("applies the console theme through Cloudscape", () => {
    const result = applyAwsConsoleTheme();
    expect(mockApplyTheme).toHaveBeenCalledWith({ theme: AWS_CONSOLE_THEME });
    expect(result).toHaveProperty("reset");
  });

  it("uses the sampled 2026 console colours in light mode only", () => {
    const t = AWS_CONSOLE_THEME.tokens as Record<string, unknown>;
    expect(t.colorBackgroundButtonPrimaryDefault).toEqual({ light: AWS_CONSOLE_COLORS.primary });
    expect(t.colorTextButtonPrimaryDefault).toEqual({ light: "#10141a" });
    expect(t.colorTextLinkDefault).toEqual({ light: "#376ede" });
    expect(t.colorBackgroundLayoutMain).toEqual({ light: "#ffffff" });
  });

  it("keeps Cloudscape's rounded corners, as the current console does", () => {
    expect(AWS_CONSOLE_THEME.tokens).not.toHaveProperty("borderRadiusButton");
    expect(AWS_CONSOLE_THEME.tokens).not.toHaveProperty("borderRadiusContainer");
  });

  it("paints the top navigation squid ink in both modes", () => {
    const top = AWS_CONSOLE_THEME.contexts!["top-navigation"]!.tokens as Record<string, unknown>;
    expect(top.colorBackgroundContainerContent).toBe("#171d24");
  });
});
