import React from "react";

/**
 * Simplified Cloudscape Modal / ButtonDropdown for happy-dom tests.
 * The real Modal keeps its dialog in the DOM when hidden and ButtonDropdown
 * renders items in a portal on open — both awkward to drive in happy-dom.
 *
 * @example
 * vi.mock("@cloudscape-design/components", async (orig) => ({
 *   ...(await orig<object>()),
 *   ...(await import("../../../test/cloudscapeMocks")).cloudscapeMocks,
 * }));
 */
export const cloudscapeMocks = {
  Modal: ({ visible, header, footer, children, onDismiss }: any) =>
    visible ? (
      <div role="dialog" aria-label={typeof header === "string" ? header : undefined}>
        <h2>{header}</h2>
        <button onClick={onDismiss}>Dismiss modal</button>
        {children}
        {footer}
      </div>
    ) : null,
  ButtonDropdown: ({ items, onItemClick, children, mainAction }: any) => (
    <div data-testid="button-dropdown">
      {mainAction && <button onClick={mainAction.onClick}>{mainAction.text}</button>}
      <span>{children}</span>
      {items.flatMap((it: any) => (it.items ? it.items : [it])).map((it: any) => (
        <button key={it.id} disabled={!!it.disabled} onClick={() => onItemClick({ detail: { id: it.id } })}>
          {it.text}
        </button>
      ))}
    </div>
  ),
};
