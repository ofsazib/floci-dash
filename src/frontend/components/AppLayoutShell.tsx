import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout, SideNavigation, TopNavigation } from "@cloudscape-design/components";
import type { SideNavigationProps } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { SERVICE_CATEGORIES, SERVICE_LABELS } from "../types/services";

interface Props {
  children: React.ReactNode;
}

// Narrower type for items nested inside section-groups (no Divider allowed)
type SectionItem = SideNavigationProps.Link | SideNavigationProps.Section | SideNavigationProps.LinkGroup | SideNavigationProps.ExpandableLinkGroup;

export default function AppLayoutShell({ children }: Props) {
  const [navOpen, setNavOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: health } = useHealth();

  const currentPath = location.pathname;

  const navItems: SideNavigationProps.Item[] = [
    { type: "link", text: "Dashboard", href: "/" },
    { type: "divider" },
  ];

  if (health) {
    for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
      const items: SectionItem[] = services
        .filter((s) => s in health.services)
        .map((s) => ({
          type: "link" as const,
          text: SERVICE_LABELS[s] || s,
          href: `/services/${s}`,
        }));

      if (items.length > 0) {
        navItems.push({
          type: "section-group" as const,
          title: category,
          items,
        });
      }
    }
  }

  navItems.push(
    { type: "divider" },
    { type: "link", text: "Settings", href: "/settings" }
  );

  const version = health?.version || "\u2014";
  const running = health?.stats?.running || 0;
  const total = health?.stats?.total || 0;

  return (
    <>
      <TopNavigation
        identity={{
          href: "/#/",
          title: `Floci Dashboard${version !== "\u2014" ? ` v${version}` : ""}`,
        }}
        i18nStrings={{
          searchIconAriaLabel: "Search",
          searchDismissIconAriaLabel: "Close search",
          overflowMenuTriggerText: "More",
        }}
      />
      <AppLayout
        navigationOpen={navOpen}
        onNavigationChange={({ detail }) => setNavOpen(detail.open)}
        navigation={
          <SideNavigation
            header={{ text: `Services (${running}/${total})`, href: "/#/" }}
            activeHref={`/#${currentPath}`}
            onFollow={(e) => {
              e.preventDefault();
              const href = e.detail.href;
              if (href) {
                const path = href.replace(/^\/#/, "") || "/";
                navigate(path);
              }
            }}
            items={navItems}
          />
        }
        content={children}
        toolsHide
      />
    </>
  );
}
