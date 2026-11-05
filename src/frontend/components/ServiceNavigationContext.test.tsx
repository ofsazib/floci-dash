import { describe, it, expect, vi } from "vitest";
// @vitest-environment happy-dom
import { render, act } from "@testing-library/react";
import {
  ShellProvider,
  useShell,
  useServiceNavigation,
  useBreadcrumbs,
} from "./ServiceNavigationContext";

function Probe({ register }: { register?: boolean }) {
  const shell = useShell();
  if (register) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useServiceNavigation({ header: { text: "svc", href: "#svc" }, items: [], activeHref: "#svc", onFollow: () => {} });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useBreadcrumbs([{ text: "root", href: "#/" }]);
  }
  return (
    <button
      onClick={() => {
        shell.setServiceNav(null);
        shell.setBreadcrumbs(null);
      }}
    >
      probe {shell.serviceNav ? "nav" : "empty"} {shell.breadcrumbs ? "crumbs" : "no-crumbs"}
    </button>
  );
}

describe("ServiceNavigationContext", () => {
  it("falls back to noop setters and null state outside a provider", () => {
    const { getByRole } = render(<Probe />);
    expect(getByRole("button").textContent).toContain("empty");
    expect(getByRole("button").textContent).toContain("no-crumbs");
    getByRole("button").click();
    expect(getByRole("button").textContent).toContain("empty");
  });

  it("provider state updates through the setters", async () => {
    let host: ReturnType<typeof useShell> | null = null;
    function Capture() {
      host = useShell();
      return null;
    }
    render(
      <ShellProvider>
        <Capture />
      </ShellProvider>
    );
    act(() => {
      host!.setServiceNav({ header: { text: "x", href: "#x" }, items: [], activeHref: "#x", onFollow: () => {} });
      host!.setBreadcrumbs([{ text: "b", href: "#b" }]);
    });
    expect(host!.serviceNav?.header.text).toBe("x");
    expect(host!.breadcrumbs?.[0].text).toBe("b");
  });
});
