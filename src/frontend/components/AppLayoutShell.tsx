import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayoutToolbar, SideNavigation, TopNavigation, Input, Button, Autosuggest, Modal, Box, SpaceBetween, StatusIndicator, Flashbar, BreadcrumbGroup } from "@cloudscape-design/components";
import type { SideNavigationProps, AutosuggestProps } from "@cloudscape-design/components";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";
import { getBrand } from "../lib/brand";
import { useFavorites } from "../stores/favorites";
import { useRecentlyVisited } from "../hooks/useRecentlyVisited";
import { SERVICE_LABELS, CATEGORY_ORDER, SERVICE_CATEGORY_MAP } from "../types/services";
import { useToastItems } from "./Toast";
import { ShellProvider, useShell } from "./ServiceNavigationContext";
import ServicesMenu from "./ServicesMenu";
import FavoritesBar from "./FavoritesBar";

const REPO_URL = "https://github.com/ofsazib/floci-dash";
const README_URL = `${REPO_URL}#readme`;

interface Props {
  children: React.ReactNode;
}

const brand = getBrand();
// Floci's defaults (see the dashboard backend's AWS_REGION and Floci's fixed account).
const FLOCI_REGION = "us-east-1";
const FLOCI_ACCOUNT_ID = "000000000000";

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
  return (
    <ShellProvider>
      <Shell>{children}</Shell>
    </ShellProvider>
  );
}

function Shell({ children }: Props) {
  const { serviceNav, breadcrumbs } = useShell();
  const toastItems = useToastItems();
  const [navOpen, setNavOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
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

  // Alt+S (as in the AWS console) or Cmd+K / Ctrl+K — focus the global service search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.metaKey || e.ctrlKey) && e.key === "k") || (e.altKey && e.key.toLowerCase() === "s")) {
        e.preventDefault();
        // Focus the input inside the Autosuggest (the header search is always mounted)
        const input = searchRef.current!.querySelector("input")!;
        input.focus();
        input.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

    // Every key maps to a distinct label via the constants above (or falls back to the key itself),
    // so no dedup is needed.
    for (const key of flociServices) {
      const label = IMPLEMENTED_SERVICES[key] || SERVICE_LABELS[key] || key;
      all.push({ value: label, label, description: key });
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
      items.push({ type: "divider" as const });
      items.push({ type: "link" as const, text: "Settings", href: "/#/settings" });
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
      navigate(path);
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
    const contentEl = document.querySelector<HTMLElement>("main, [role='main'], #main-content")!;
    contentEl.setAttribute("tabindex", "-1");
    contentEl.focus();
    contentEl.scrollIntoView({ behavior: "smooth" });
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
            title: isMobile && brand.title ? brand.name : brand.title,
            logo: { src: brand.logo, alt: brand.name },
          }}
          search={
            <div className="fd-topnav-search">
            <ServicesMenu serviceKeys={health?.services ? Object.keys(health.services) : []} />
            <div ref={searchRef} className={isMobile ? "fd-hide-mobile" : ""} style={{ position: "relative", width: isMobile ? 0 : "min(640px, 45vw)" }}>
              <Autosuggest
                placeholder="Search"
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
              <kbd
                style={{
                  position: "absolute",
                  right: "28px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border-input, #5b5b5b)",
                  backgroundColor: "var(--color-background-input-default, #1a1a1a)",
                  color: "var(--color-text-input-placeholder, #888)",
                  lineHeight: "1.4",
                  opacity: 0.7,
                }}
              >
                [Alt+S]
              </kbd>
            </div>
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
              iconName: "status-info",
              ariaLabel: "Help",
              href: README_URL,
              // New tab without the external-link arrow, as the console's help icon.
              target: "_blank",
              rel: "noopener noreferrer",
            },
            {
              type: "menu-dropdown",
              iconName: "settings",
              ariaLabel: "Settings",
              title: "Settings",
              items: [
                { id: "settings", text: "Settings", href: "/#/settings" },
                { id: "toggle-theme", text: darkMode ? "Switch to light mode" : "Switch to dark mode" },
              ],
              onItemClick: (e) => {
                if (e.detail.id === "toggle-theme") toggleDarkMode();
              },
            },
            {
              type: "menu-dropdown",
              text: FLOCI_REGION,
              title: "Region",
              description: "Set with AWS_REGION on the dashboard backend.",
              items: [{ id: "region", text: FLOCI_REGION, disabled: true }],
            },
            {
              type: "menu-dropdown",
              text: "test",
              title: "Floci account",
              description: `Account ID: ${FLOCI_ACCOUNT_ID}`,
              items: [{ id: "settings", text: "Settings", href: "/#/settings" }],
            },
          ]}
          i18nStrings={{ searchIconAriaLabel: "Search", overflowMenuTriggerText: "More" }}
        />
        <FavoritesBar />
      </div>
      <AppLayoutToolbar
        content={
          <div ref={mainRef} id="main-content" data-testid="app-layout-content">
            {children}
          </div>
        }
        notifications={toastItems.length > 0 ? <Flashbar items={toastItems} /> : undefined}
        breadcrumbs={
          breadcrumbs ? (
            <BreadcrumbGroup
              items={breadcrumbs}
              ariaLabel="Breadcrumbs"
              onFollow={(e) => {
                e.preventDefault();
                // "#section" crumbs point inside the current service page.
                if (serviceNav && e.detail.href.startsWith("#")) serviceNav.onFollow(e.detail.href);
                else navigate(e.detail.href.replace("/#", ""));
              }}
            />
          ) : undefined
        }
        navigationOpen={navOpen}
        onNavigationChange={(e) => setNavOpen(e.detail.open)}
        navigation={
          serviceNav ? (
            <div>
              <SideNavigation
                header={serviceNav.header}
                activeHref={serviceNav.activeHref}
                items={serviceNav.items}
                onFollow={(e) => {
                  e.preventDefault();
                  serviceNav.onFollow(e.detail.href);
                }}
              />
              {serviceNav.footer}
            </div>
          ) : (
          <div>
            <div className="fd-nav-header">
              <a
                href="/#/"
                className="fd-nav-header-title"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                {brand.name}
              </a>
            </div>
            <div className="fd-nav-tools">
              <Input
                placeholder="Find services"
                type="search"
                value={navQuery}
                onChange={(e) => setNavQuery(e.detail.value)}
                clearAriaLabel="Clear search"
                ariaLabel="Filter services by name"
              />
              <div className="fd-nav-status">
                <span>
                  <span className={allHealthy ? "fd-dot-success" : "fd-dot-warning"} />
                  {running} / {total} services running
                </span>
                {!navQuery && (
                  <Button variant="inline-link" onClick={toggleAll}>
                    {navAllExpanded ? "Collapse all" : "Expand all"}
                  </Button>
                )}
              </div>
            </div>
            <SideNavigation
              key={navKey}
              activeHref={currentHref}
              onFollow={handleFollow as any}
              items={navItems}
            />
          </div>
          )
        }
        navigationWidth={260}
        headerSelector="#header"
        footerSelector="#footer"
      />
      <footer id="footer" className="fd-console-footer">
        <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">Feedback</a>
        <span className="fd-console-footer-right">
          <span>© {new Date().getFullYear()}, Floci Dash. Not affiliated with Amazon Web Services.</span>
          <a href={README_URL} target="_blank" rel="noreferrer">Documentation</a>
        </span>
      </footer>
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
                <StatusIndicator type="warning">
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
