import type { OrgAccount } from "../../../hooks/useOrganizations";

/** Policy types Floci accepts on CreatePolicy / EnablePolicyType, grouped as in the AWS console. */
export const POLICY_TYPES: { type: string; label: string; category: "Authorization policies" | "Management policies"; description: string }[] = [
  { type: "SERVICE_CONTROL_POLICY", label: "Service control policies", category: "Authorization policies", description: "Set the maximum permissions available to IAM users and roles in member accounts." },
  { type: "RESOURCE_CONTROL_POLICY", label: "Resource control policies", category: "Authorization policies", description: "Set the maximum permissions available on resources in member accounts." },
  { type: "DECLARATIVE_POLICY_EC2", label: "Declarative policies", category: "Management policies", description: "Declare and enforce EC2 service configurations across accounts." },
  { type: "BACKUP_POLICY", label: "Backup policies", category: "Management policies", description: "Apply backup plans to resources across accounts." },
  { type: "TAG_POLICY", label: "Tag policies", category: "Management policies", description: "Standardize the tags attached to resources." },
  { type: "CHATBOT_POLICY", label: "Chat applications policies", category: "Management policies", description: "Control access to accounts from chat applications." },
  { type: "AISERVICES_OPT_OUT_POLICY", label: "AI services opt-out policies", category: "Management policies", description: "Control data collection by AI services." },
  { type: "SECURITYHUB_POLICY", label: "Security Hub policies", category: "Management policies", description: "Apply Security Hub configuration across accounts." },
];

export function policyTypeLabel(type: string): string {
  return POLICY_TYPES.find((p) => p.type === type)?.label ?? type;
}

/** "2022/10/27" — the console's date format on the AWS accounts page. */
export function formatOrgDate(value: string | Date | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

/** "Created 2022/11/04" for accounts made in the organization, "Joined …" for invited ones. */
export function accountDateLabel(account: OrgAccount): string {
  const date = formatOrgDate(account.JoinedTimestamp);
  if (!date) return "";
  return `${account.JoinedMethod === "CREATED" ? "Created" : "Joined"} ${date}`;
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function accountsCsv(accounts: OrgAccount[]): string {
  const rows = [["Account name", "Account ID", "Email", "Status", "Joined method", "Joined date"]];
  for (const a of accounts) rows.push([a.Name, a.Id, a.Email, a.Status, a.JoinedMethod ?? "", formatOrgDate(a.JoinedTimestamp)]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Valid JSON object? Returns an error message or null. */
export function jsonError(text: string): string | null {
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? null : "The policy must be a JSON object.";
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
}
