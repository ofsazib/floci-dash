import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppLayout, SideNavigation, TopNavigation, StatusIndicator } from "@cloudscape-design/components";
import type { SideNavigationProps } from "@cloudscape-design/components";
import { useHealth, useActiveServices } from "../hooks/useSystem";
import { useSettings } from "../stores/settings";
import { SERVICE_LABELS } from "../types/services";
interface Props {
  children: React.ReactNode;
}

type NavItem = SideNavigationProps.Link | SideNavigationProps.ExpandableLinkGroup;

const FLOCI_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#0073e6"/></linearGradient></defs><rect width="32" height="32" rx="7" fill="url(#g)"/><text x="16" y="23" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">F</text></svg>'
)}`;

// Services with full management UI (dedicated pages)
const IMPLEMENTED_SERVICES: Record<string, string> = {
  ec2: "EC2",
  lambda: "Lambda",
  s3: "S3",
  dynamodb: "DynamoDB",
  rds: "RDS",
  sqs: "SQS",
  sns: "SNS",
  events: "EventBridge",
  logs: "CloudWatch Logs",
  cloudwatch: "CloudWatch",
};

const CATEGORY_ORDER = [
  "Compute",
  "Storage",
  "Database",
  "Networking",
  "Messaging",
  "Security",
  "Management",
  "Analytics",
  "ML/AI",
  "Billing",
  "Developer Tools",
  "Migration",
] as const;

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  ec2: "Compute", lambda: "Compute", ecs: "Compute", eks: "Compute", autoscaling: "Compute",
  s3: "Storage", ecr: "Storage",
  dynamodb: "Database", rds: "Database", neptune: "Database", elasticache: "Database",
  elasticloadbalancing: "Networking", route53: "Networking", cloudfront: "Networking",
  apigateway: "Networking", apigatewayv2: "Networking", appsync: "Networking",
  sqs: "Messaging", sns: "Messaging", events: "Messaging", kinesis: "Messaging",
  pipes: "Messaging", scheduler: "Messaging", email: "Messaging",
  iam: "Security", sts: "Security", "cognito-idp": "Security", kms: "Security",
  secretsmanager: "Security", acm: "Security",
  cloudformation: "Management", monitoring: "Management", logs: "Management", ssm: "Management",
  config: "Management", appconfig: "Management", appconfigdata: "Management",
  cloudtrail: "Management", servicediscovery: "Management",
  athena: "Analytics", glue: "Analytics", firehose: "Analytics", states: "Analytics",
  kafka: "Analytics", es: "Analytics",
  "bedrock-runtime": "ML/AI", textract: "ML/AI", transcribe: "ML/AI",
  ce: "Billing", cur: "Billing", "bcm-data-exports": "Billing", pricing: "Billing", tagging: "Billing",
  codedeploy: "Developer Tools", codebuild: "Developer Tools",
  backup: "Migration", transfer: "Migration",
};

function ActiveDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: "#037f0c",
        flexShrink: 0,
      }}
    />
  );
}

export default function AppLayoutShell({ children }: Props) {
  const [navOpen, setNavOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: health } = useHealth();
  const { data: active } = useActiveServices();
  const { darkMode, toggleDarkMode } = useSettings();

  useEffect(() => {
    document.body.classList.toggle("awsui-dark-mode", darkMode);
    document.documentElement.classList.toggle("awsui-dark-mode", darkMode);
  }, [darkMode]);

  const currentHref = location.pathname ? `/#${location.pathname}` : "/#/";

  const navItems = useMemo(() => {
    const items: SideNavigationProps.Item[] = [
      { type: "link" as const, text: "Dashboard", href: "/#/" },
      { type: "divider" as const },
    ];

    // ── Implemented services (full management UI) ──
    const activeSet = new Set(active?.activeServices || []);
    const implementedKeys = Object.keys(IMPLEMENTED_SERVICES);

    // Only show implemented services that Floci reports
    const flociServices = health?.services ? Object.keys(health.services) : [];
    const availableImplemented = implementedKeys.filter((k) => flociServices.includes(k));

    if (availableImplemented.length > 0) {
      items.push({
        type: "section" as const,
        text: "Resources",
        items: availableImplemented.map((key) => ({
          type: "link" as const,
          text: IMPLEMENTED_SERVICES[key],
          href: `/#/services/${key}`,
          info: activeSet.has(key) ? <ActiveDot /> : undefined,
        })) as SideNavigationProps.Item[],
      });
    }

    // ── All services by category ──
    if (!health?.services) {
      return items;
    }

    items.push({ type: "divider" as const });

    const grouped: Record<string, Array<{ key: string; label: string; status: string }>> = {};
    for (const svc of flociServices) {
      if (IMPLEMENTED_SERVICES[svc]) continue; // Skip already shown
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
      items.push({
        type: "expandable-link-group" as const,
        text: cat,
        href: `/#/category/${cat.toLowerCase()}`,
        items: svcs
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((s) => ({
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
  }, [health, active]);

  const handleFollow = (e: CustomEvent<{ href: string }>) => {
    e.preventDefault();
    const path = e.detail.href.replace("/#", "");
    navigate(path || "/");
  };

  const running = health?.stats?.running ?? 0;
  const total = health?.stats?.total ?? 0;
  const allHealthy = running === total;

  return (
    <>
      <div id="header">
        <TopNavigation
          identity={{
            href: "/#/",
            title: "Floci Dashboard",
            logo: { src: FLOCI_LOGO_SVG, alt: "Floci" },
          }}
          utilities={[
            {
              type: "button",
              text: darkMode ? "\u2600 Light" : "\u263D Dark",
              onClick: toggleDarkMode,
            },
          ]}
          i18nStrings={{ searchIconAriaLabel: "Search", overflowMenuTriggerText: "More" }}
        />
      </div>
      <AppLayout
        content={children}
        navigationOpen={navOpen}
        onNavigationChange={(e) => setNavOpen(e.detail.open)}
        navigation={
          <div>
            <div
              className="fd-nav-health"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px 6px",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: allHealthy ? "#037f0c" : "#d89914",
                  boxShadow: allHealthy ? "0 0 6px #037f0c66" : "0 0 6px #d8991466",
                }}
              />
              {running} / {total} services running
            </div>
            <SideNavigation
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
    </>
  );
}
