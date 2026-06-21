import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout, SideNavigation, TopNavigation, Input, Button, Autosuggest, Modal, Box, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import type { SideNavigationProps, AutosuggestProps } from "@cloudscape-design/components";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";
import { useFavorites } from "../stores/favorites";
import { useRecentlyVisited } from "../hooks/useRecentlyVisited";
import { SERVICE_LABELS, CATEGORY_ORDER, SERVICE_CATEGORY_MAP } from "../types/services";

interface Props {
  children: React.ReactNode;
}

const FLOCI_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#0073e6"/></linearGradient></defs><rect width="32" height="32" rx="7" fill="url(#g)"/><text x="16" y="23" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">F</text></svg>'
)}`;

// Services with full management UI (dedicated pages)
const IMPLEMENTED_SERVICES: Record<string, string> = {
  ec2: "EC2",
  lambda: "Lambda",
  iam: "IAM",
  s3: "S3",
  dynamodb: "DynamoDB",
  rds: "RDS",
  sqs: "SQS",
  sns: "SNS",
  events: "EventBridge",
  logs: "CloudWatch Logs",
  cloudwatch: "CloudWatch",
  secretsmanager: "Secrets Manager",
  cloudformation: "CloudFormation",
  kms: "KMS",
  ecs: "ECS",
  ssm: "Systems Manager",
  route53: "Route 53",
  apigateway: "API Gateway",
  batch: "AWS Batch",
  memorydb: "MemoryDB",
};

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <path d="M8 1.5c-2.2 0-4 1.8-4 4v2.2L2.7 10.7C2.2 11.5 2.8 12.5 3.7 12.5H12.3c.9 0 1.5-1 .9-1.8L12 7.7V5.5c0-2.2-1.8-4-4-4zM6.5 13.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5" fill="currentColor"/>
  </svg>
);

function ActiveDot() {
  return (
    <span
      className="fd-dot-success"
      style={{ display: "inline-block", width: "6px", height: "6px" }}
    />
  );
}

export default function AppLayoutShell({ children }: Props) {
  const [navOpen, setNavOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const mainRef = useRef<HTMLDivElement>(null);
  const [navQuery, setNavQuery] = useState("");
  const [navAllExpanded, setNavAllExpanded] = useState(false);
  const [navKey, setNavKey] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: health } = useHealth();
  const { data: active } = useActiveServices();
  const { darkMode, toggleDarkMode } = useSettings();

  useEffect(() => {
    document.body.classList.toggle("awsui-dark-mode", darkMode);
    document.documentElement.classList.toggle("awsui-dark-mode", darkMode);
  }, [darkMode]);

  // Track viewport size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentHref = location.pathname ? `/#${location.pathname}` : "/#/";
  const query = navQuery.toLowerCase().trim();

  const toggleAll = useCallback(() => {
    setNavAllExpanded((prev) => !prev);
    setNavKey((k) => k + 1);
  }, []);

  const searchOptions: AutosuggestProps.Options = useMemo(() => {
    const flociServices = health?.services ? Object.keys(health.services) : [];
    const all: AutosuggestProps.Option[] = [];
    const added = new Set<string>();

    for (const key of flociServices) {
      const label = IMPLEMENTED_SERVICES[key] || SERVICE_LABELS[key] || key;
      if (!added.has(label)) {
        added.add(label);
        all.push({ value: label, label, description: key });
      }
    }

    const sorted = all.sort((a, b) => a.label!.localeCompare(b.label!));
    return [
      { label: "Services", options: sorted },
    ];
  }, [health]);

  const navItems = useMemo(() => {
    const { favorites } = useFavorites.getState();
    const { recentlyVisited } = useRecentlyVisited.getState();
    const items: SideNavigationProps.Item[] = [
      { type: "link" as const, text: "Dashboard", href: "/#/" },
      { type: "divider" as const },
    ];

    const activeSet = new Set(active?.activeServices || []);
    const implementedKeys = Object.keys(IMPLEMENTED_SERVICES);
    const flociServices = health?.services ? Object.keys(health.services) : [];

    // ── Favorites ──
    const validFavorites = favorites.filter((k) => flociServices.includes(k));
    if (validFavorites.length > 0) {
      const textMatchesFav = (text: string) => !query || text.toLowerCase().includes(query);
      const filteredFavs = validFavorites.filter((k) =>
        textMatchesFav(SERVICE_LABELS[k] || k),
      );
      if (filteredFavs.length > 0) {
        items.push({
          type: "section" as const,
          text: "★ Favorites",
          items: filteredFavs.map((key) => ({
            type: "link" as const,
            text: SERVICE_LABELS[key] || key,
            href: `/#/services/${key}`,
            info: activeSet.has(key) ? <ActiveDot /> : undefined,
          })) as SideNavigationProps.Item[],
        });
      }
    }

    // ── Recently Visited ──
    const validRecent = recentlyVisited.filter((k) => flociServices.includes(k));
    if (validRecent.length > 0) {
      const textMatchesRecent = (text: string) => !query || text.toLowerCase().includes(query);
      const filteredRecent = validRecent.filter((k) =>
        textMatchesRecent(SERVICE_LABELS[k] || k),
      );
      if (filteredRecent.length > 0) {
        items.push({
          type: "section" as const,
          text: "Recently Visited",
          items: filteredRecent.map((key) => ({
            type: "link" as const,
            text: SERVICE_LABELS[key] || key,
            href: `/#/services/${key}`,
            info: activeSet.has(key) ? <ActiveDot /> : undefined,
          })) as SideNavigationProps.Item[],
        });
      }
    }

    const availableImplemented = implementedKeys.filter((k) => flociServices.includes(k));

    // ── Filter helpers ──
    const textMatches = (text: string) => !query || text.toLowerCase().includes(query);

    // ── When searching, show all matches in one flat list ──
    if (query) {
      const allMatching: Array<{ key: string; label: string }> = [];

      // Add implemented services that match
      for (const k of availableImplemented) {
        if (textMatches(IMPLEMENTED_SERVICES[k])) {
          allMatching.push({ key: k, label: IMPLEMENTED_SERVICES[k] });
        }
      }

      // Add non-implemented services that match
      if (health?.services) {
        for (const svc of flociServices) {
          if (IMPLEMENTED_SERVICES[svc]) continue;
          const label = SERVICE_LABELS[svc] || svc;
          if (textMatches(label)) {
            allMatching.push({ key: svc, label });
          }
        }
      }

      if (allMatching.length > 0) {
        items.push({
          type: "section" as const,
          text: "Search Results",
          items: allMatching
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((s) => ({
              type: "link" as const,
              text: s.label,
              href: `/#/services/${s.key}`,
              info: activeSet.has(s.key) ? <ActiveDot /> : undefined,
            })) as SideNavigationProps.Item[],
        });
      } else {
        items.push({
          type: "section" as const,
          text: "Search Results",
          items: [{ type: "link" as const, text: "No matches", href: "" }],
        });
      }

      items.push({ type: "divider" as const });
      items.push({ type: "link" as const, text: "Settings", href: "/#/settings" });
      return items;
    }

    // ── Implemented services (no query — show as Resources) ──
    const filteredImplemented = availableImplemented.filter((k) =>
      textMatches(IMPLEMENTED_SERVICES[k]),
    );

    if (filteredImplemented.length > 0) {
      items.push({
        type: "section" as const,
        text: "Resources",
        items: filteredImplemented.map((key) => ({
          type: "link" as const,
          text: IMPLEMENTED_SERVICES[key],
          href: `/#/services/${key}`,
          info: activeSet.has(key) ? <ActiveDot /> : undefined,
        })) as SideNavigationProps.Item[],
      });
    }

    // ── All services by category (no query) ──
    if (!health?.services) {
      return items;
    }

    items.push({ type: "divider" as const });

    const grouped: Record<string, Array<{ key: string; label: string; status: string }>> = {};
    for (const svc of flociServices) {
      if (IMPLEMENTED_SERVICES[svc]) continue;
      const category = SERVICE_CATEGORY_MAP[svc] || "Other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        key: svc,
        label: SERVICE_LABELS[svc] || svc,
        status: health.services[svc],
      });
    }

    for (const cat of CATEGORY_ORDER) {
      const svcs = grouped[cat];
      if (!svcs || svcs.length === 0) continue;

      const sorted = svcs.sort((a, b) => a.label.localeCompare(b.label));
      items.push({
        type: "expandable-link-group" as const,
        text: cat,
        href: `/#/category/${cat.toLowerCase()}`,
        defaultExpanded: navAllExpanded || undefined,
        items: sorted.map((s) => ({
          type: "link" as const,
          text: s.label,
          href: `/#/services/${s.key}`,
        })),
      } as SideNavigationProps.ExpandableLinkGroup);
    }

    const other = grouped["Other"];
    if (other && other.length > 0) {
      items.push({
        type: "expandable-link-group" as const,
        text: "Other",
        href: "/#/category/other",
        defaultExpanded: navAllExpanded || undefined,
        items: other.map((s) => ({
          type: "link" as const,
          text: s.label,
          href: `/#/services/${s.key}`,
        })),
      } as SideNavigationProps.ExpandableLinkGroup);
    }

    items.push({ type: "divider" as const });
    items.push({ type: "link" as const, text: "Settings", href: "/#/settings" });

    return items;
  }, [health, active, query, navAllExpanded]);

  const handleFollow = (e: CustomEvent<{ href: string }>) => {
    e.preventDefault();
    const path = e.detail.href.replace("/#", "");
    if (path) {
      // Track recently visited services
      const serviceMatch = path.match(/^\/services\/([^/]+)/);
      if (serviceMatch) {
        useRecentlyVisited.getState().addVisited(serviceMatch[1]);
      }
      navigate(path || "/");
    }
  };

  const running = health?.stats?.running ?? 0;
  const total = health?.stats?.total ?? 0;
  const allHealthy = running === total;

  const nonRunningServices = useMemo(() => {
    if (!health?.services) return [];
    return Object.entries(health.services)
      .filter(([, status]) => status !== "running")
      .map(([key, status]) => ({ key, status }));
  }, [health]);

  const handleSkipToContent = () => {
    // Focus the main content area — prefer semantic selectors first
    const contentEl = document.querySelector<HTMLElement>("main, [role='main'], #main-content");
    if (contentEl) {
      contentEl.setAttribute("tabindex", "-1");
      contentEl.focus();
      contentEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Skip to main content link — visually hidden until focused via CSS :focus-visible */}
      <a
        href="#main-content"
        className="fd-skip-link"
        onClick={(e) => {
          e.preventDefault();
          handleSkipToContent();
        }}
      >
        Skip to main content
      </a>
      <div id="header">
        <TopNavigation
          identity={{
            href: "/#/",
            title: isMobile ? "Floci" : "Floci Dashboard",
            logo: { src: FLOCI_LOGO_SVG, alt: "Floci" },
          }}
          search={
            <div className={isMobile ? "fd-hide-mobile" : ""} style={{ minWidth: isMobile ? 0 : 200, maxWidth: 300 }}>
              <Autosuggest
                placeholder="Search services..."
                ariaLabel="Search services"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.detail.value)}
                onSelect={(e) => {
                  const label = e.detail.value;
                  const flociServices = health?.services ? Object.keys(health.services) : [];
                  const found = flociServices.find(
                    (k) => (IMPLEMENTED_SERVICES[k] || SERVICE_LABELS[k] || k) === label,
                  );
                  if (found) {
                    setGlobalSearch("");
                    useRecentlyVisited.getState().addVisited(found);
                    navigate(`/services/${found}`);
                  }
                }}
                options={searchOptions}
                enteredTextLabel={(v) => `Search for "${v}"`}
                empty="No matching services"
              />
            </div>
          }
          utilities={[
            {
              type: "button",
              iconSvg: <BellIcon />,
              ariaLabel: "Notifications",
              badge: nonRunningServices.length > 0,
              onClick: () => setShowNotifications(true),
            },
            {
              type: "button",
              text: darkMode ? "\u2600" : "\u263D",
              ariaLabel: darkMode ? "Switch to light mode" : "Switch to dark mode",
              onClick: toggleDarkMode,
            },
          ]}
          i18nStrings={{ searchIconAriaLabel: "Search", overflowMenuTriggerText: "More" }}
        />
      </div>
      <AppLayout
        content={
          <div ref={mainRef} id="main-content" data-testid="app-layout-content">
            {children}
          </div>
        }
        navigationOpen={navOpen}
        onNavigationChange={(e) => setNavOpen(e.detail.open)}
        navigation={
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px 6px",
                fontSize: "12px",
              }}
            >
              <span className={allHealthy ? "fd-dot-success" : "fd-dot-warning"} />
              {running} / {total} services running
            </div>
            <div style={{ padding: "0 12px 8px" }}>
              <Input
                placeholder="Find services..."
                type="search"
                value={navQuery}
                onChange={(e) => setNavQuery(e.detail.value)}
                clearAriaLabel="Clear search"
                ariaLabel="Filter services by name"
              />
            </div>
            {!navQuery && (
              <div style={{ padding: "0 12px 8px", textAlign: "right" }}>
                <Button
                  variant="inline-link"
                  onClick={toggleAll}
                >
                  {navAllExpanded ? "Collapse all" : "Expand all"}
                </Button>
              </div>
            )}
            <SideNavigation
              key={navKey}
              header={{ text: "Floci", href: "/#/" }}
              activeHref={currentHref}
              onFollow={handleFollow as any}
              items={navItems}
            />
          </div>
        }
        toolsHide
        navigationWidth={260}
        headerSelector="#header"
      />
      <Modal
        visible={showNotifications}
        onDismiss={() => setShowNotifications(false)}
        header="Notifications"
      >
        {nonRunningServices.length === 0 ? (
          <Box variant="p">All services are running.</Box>
        ) : (
          <SpaceBetween size="s">
            {nonRunningServices.map(({ key, status }) => (
              <Box key={key} variant="p">
                <StatusIndicator type={status === "running" ? "success" : "warning"}>
                  {SERVICE_LABELS[key as keyof typeof SERVICE_LABELS] || key}: {status}
                </StatusIndicator>
              </Box>
            ))}
          </SpaceBetween>
        )}
      </Modal>
    </>
  );
}
