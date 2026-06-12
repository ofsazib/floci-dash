import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout, SideNavigation, TopNavigation } from "@cloudscape-design/components";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import type { SideNavigationProps } from "@cloudscape-design/components";
import { useHealth } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";
import { SERVICE_CATEGORIES, SERVICE_LABELS } from "../types/services";

interface Props {
  children: React.ReactNode;
}

type SectionItem = SideNavigationProps.Link | SideNavigationProps.Section | SideNavigationProps.LinkGroup | SideNavigationProps.ExpandableLinkGroup;

export default function AppLayoutShell({ children }: Props) {
  const [navOpen, setNavOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: health } = useHealth();
  const { darkMode, toggleDarkMode } = useSettings();

  // Apply dark mode using Cloudscape's stable public API
  useEffect(() => {
    applyMode(darkMode ? Mode.Dark : Mode.Light);
  }, [darkMode]);

  const currentPath = location.pathname;
  const running = health?.stats?.running ?? 0;
  const total = health?.stats?.total ?? 0;

  const navItems: SideNavigationProps.Item[] = [
    { type: "link", text: "Dashboard", href: "/" },
    { type: "link", text: `Services (${running}/${total})`, href: "/" },
    { type: "divider" },
  ];

  if (health) {
    for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
      const items = services
        .filter((s) => health.services[s])
        .map((s) => ({
          type: "link" as const,
          text: SERVICE_LABELS[s] || s,
          href: `/services/${s}`,
        }));
      if (items.length > 0) {
        navItems.push({
          type: "section-group" as const,
          title: category,
          items: items as SectionItem[],
        });
      }
    }
  }

  navItems.push({ type: "divider" });
  navItems.push({ type: "link", text: "Settings", href: "/settings" });

  return (
    <>
      <div id="header">
        <TopNavigation
          identity={{
            href: "/",
            title: "Floci Dashboard",
            logo: {
              src: "/favicon.svg",
              alt: "Floci",
            },
          }}
          utilities={[
            {
              type: "button",
              text: darkMode ? "Light" : "Dark",
              onClick: toggleDarkMode,
              iconName: "settings",
            },
          ]}
        />
      </div>
      <AppLayout
        content={children}
        navigationOpen={navOpen}
        onNavigationChange={(e) => setNavOpen(e.detail.open)}
        navigation={
          <SideNavigation
            header={{ text: "Services", href: "/" }}
            activeHref={currentPath || "/"}
            items={navItems}
          />
        }
        toolsHide
        navigationWidth={260}
        headerSelector="#header"
      />
    </>
  );
}
