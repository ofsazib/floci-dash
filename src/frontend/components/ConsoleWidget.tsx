import type { ReactNode } from "react";
import { Box, ButtonDropdown, Container, Header, Link, SpaceBetween, type ButtonDropdownProps } from "@cloudscape-design/components";

interface Props {
  title: string;
  counter?: string;
  description?: ReactNode;
  /** Buttons shown before the ⋮ menu, e.g. a "Create" action. */
  actions?: ReactNode;
  /** Items of the ⋮ menu; the menu is hidden without items. */
  menuItems?: ButtonDropdownProps.Item[];
  onMenuItemClick?: (id: string) => void;
  /** Centered "Go to …" link at the bottom of the widget. */
  footer?: { text: string; onFollow: () => void };
  children: ReactNode;
}

/**
 * A Console Home widget: drag handle, title with counter, actions and ⋮ menu,
 * content, and a centered "Go to …" footer link.
 */
export default function ConsoleWidget({ title, counter, description, actions, menuItems, onMenuItemClick, footer, children }: Props) {
  return (
    <Container
      fitHeight
      header={
        <div className="fd-widget-header">
          <span className="fd-widget-handle" aria-hidden="true">⠿</span>
          <div className="fd-widget-title">
            <Header
              variant="h2"
              counter={counter}
              description={description}
              actions={
                actions || menuItems ? (
                  <SpaceBetween direction="horizontal" size="xs">
                    {actions}
                    {menuItems && (
                      <ButtonDropdown
                        variant="icon"
                        ariaLabel={`${title} options`}
                        items={menuItems}
                        onItemClick={({ detail }) => onMenuItemClick?.(detail.id)}
                      />
                    )}
                  </SpaceBetween>
                ) : undefined
              }
            >
              {title}
            </Header>
          </div>
        </div>
      }
      footer={
        footer ? (
          <Box textAlign="center">
            <Link
              href="#"
              onFollow={(e) => {
                e.preventDefault();
                footer.onFollow();
              }}
            >
              {footer.text}
            </Link>
          </Box>
        ) : undefined
      }
    >
      {children}
    </Container>
  );
}
