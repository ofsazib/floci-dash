import { useMemo, useState } from "react";
import { Box, ContentLayout, Spinner } from "@cloudscape-design/components";
import { useOrg, useOrgRoots, useCreateOrg } from "../../hooks/useOrganizations";
import { useToast } from "../../components/Toast";
import { useBreadcrumbs, useServiceNavigation } from "../../components/ServiceNavigationContext";
import GetStarted from "./organizations/GetStarted";
import AccountsView from "./organizations/AccountsView";
import AddAccountView from "./organizations/AddAccountView";
import { PoliciesView, PolicyTypeView } from "./organizations/PoliciesView";
import SettingsView from "./organizations/SettingsView";
import { policyTypeLabel } from "./organizations/orgUtils";

type View =
  | { name: "accounts" }
  | { name: "add-account" }
  | { name: "policies" }
  | { name: "policy-type"; type: string }
  | { name: "settings" };

const SECTION_TITLES = { accounts: "AWS accounts", policies: "Policies", settings: "Settings" } as const;

/**
 * AWS Organizations, laid out like the AWS console: its own side navigation
 * (AWS accounts / Policies / Settings), the account tree, and an intro page
 * before an organization exists.
 */
export function OrganizationsDashboard() {
  const { showToast } = useToast();
  const org = useOrg();
  const roots = useOrgRoots();
  const createOrg = useCreateOrg();
  const [view, setView] = useState<View>({ name: "accounts" });

  const orgData = org.data?.organization ?? null;
  const root = roots.data?.roots?.[0] ?? null;
  const section = view.name === "add-account" ? "accounts" : view.name === "policy-type" ? "policies" : view.name;

  const nav = useMemo(
    () => ({
      header: { text: "AWS Organizations", href: "#accounts" },
      items: orgData
        ? [
            { type: "link" as const, text: "AWS accounts", href: "#accounts" },
            { type: "link" as const, text: "Policies", href: "#policies" },
            { type: "link" as const, text: "Settings", href: "#settings" },
          ]
        : [],
      activeHref: `#${section}`,
      onFollow: (href: string) => setView({ name: href.slice(1) } as View),
      footer: orgData ? (
        <div className="fd-nav-footer">
          <div>Organization ID</div>
          <div>{orgData.Id}</div>
        </div>
      ) : undefined,
    }),
    [orgData, section],
  );
  useServiceNavigation(nav);

  const crumbs = useMemo(() => {
    const items = [
      { text: "Dashboard", href: "/#/" },
      { text: "AWS Organizations", href: "/#/services/organizations" },
    ];
    if (!orgData) return items;
    items.push({ text: SECTION_TITLES[section], href: "/#/services/organizations" });
    if (view.name === "add-account") items.push({ text: "Add an AWS account", href: "/#/services/organizations" });
    if (view.name === "policy-type") items.push({ text: policyTypeLabel(view.type), href: "/#/services/organizations" });
    return items;
  }, [orgData, section, view]);
  useBreadcrumbs(crumbs);

  async function handleCreateOrg() {
    try {
      await createOrg.mutateAsync();
      showToast("success", "Your organization has been created.");
    } catch (e) {
      showToast("error", (e as Error)?.message || "Failed to create organization");
    }
  }

  if (org.isLoading || (orgData && roots.isLoading)) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  if (!orgData) return <GetStarted onCreate={handleCreateOrg} creating={createOrg.isPending} />;

  if (!root) {
    return (
      <Box textAlign="center" padding="xxl" color="text-body-secondary">
        The organization has no root.
      </Box>
    );
  }

  return (
    <ContentLayout>
      {view.name === "accounts" && <AccountsView org={orgData} root={root} onAddAccount={() => setView({ name: "add-account" })} />}
      {view.name === "add-account" && <AddAccountView onDone={() => setView({ name: "accounts" })} />}
      {view.name === "policies" && <PoliciesView root={root} onOpen={(type) => setView({ name: "policy-type", type })} />}
      {view.name === "policy-type" && <PolicyTypeView root={root} type={view.type} />}
      {view.name === "settings" && <SettingsView org={orgData} />}
    </ContentLayout>
  );
}
