import { useState, type ReactNode } from "react";
import { Checkbox, Spinner } from "@cloudscape-design/components";
import { useOrgAccounts, useOrgOUs, type OrgAccount } from "../../../hooks/useOrganizations";
import { accountDateLabel } from "./orgUtils";

export type NodeKind = "root" | "ou" | "account";

export interface SelItem {
  kind: NodeKind;
  id: string;
  name: string;
  /** Parent container id — known in the hierarchy view, resolved on demand elsewhere. */
  parentId?: string;
}

const FolderIcon = () => (
  <svg className="fd-org-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M1.5 3.5h4.2l1.3 1.5h7.5v8h-13z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);
const AccountIcon = () => (
  <svg className="fd-org-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l5.5 3v7L8 14.5l-5.5-3v-7zM2.5 4.5L8 7.5l5.5-3M8 7.5v7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

interface RowProps {
  depth: number;
  expander?: { expanded: boolean; onToggle: () => void; label: string };
  control?: ReactNode;
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  badge?: ReactNode;
  date?: string;
}

export function TreeRow({ depth, expander, control, icon, title, subtitle, badge, date }: RowProps) {
  return (
    <div className="fd-org-row" role="row">
      <div className="fd-org-cell" role="gridcell" style={{ paddingLeft: 20 + depth * 28 }}>
        <span className="fd-org-expander">
          {expander && (
            <button type="button" aria-expanded={expander.expanded} aria-label={expander.label} onClick={expander.onToggle}>
              {expander.expanded ? "▼" : "▶"}
            </button>
          )}
        </span>
        {control}
        {icon}
        <div className="fd-org-text">
          <div className="fd-org-title">
            {title}
            {badge}
          </div>
          <div className="fd-org-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="fd-org-date" role="gridcell">{date}</div>
    </div>
  );
}

export interface SelectionProps {
  selected: Record<string, SelItem>;
  onToggle: (item: SelItem) => void;
  managementAccountId?: string;
}

/** One account row with its checkbox, "id | email", badge and created/joined date. */
export function AccountRow({ account, depth, parentId, selected, onToggle, managementAccountId }: SelectionProps & { account: OrgAccount; depth: number; parentId?: string }) {
  const item: SelItem = { kind: "account", id: account.Id, name: account.Name, parentId };
  const checked = !!selected[account.Id];
  return (
    <TreeRow
      depth={depth}
      control={<Checkbox checked={checked} ariaLabel={`Select ${account.Name}`} onChange={() => onToggle(item)} />}
      icon={<AccountIcon />}
      title={
        <button type="button" className="fd-org-name" onClick={() => onToggle(item)}>
          {account.Name}
        </button>
      }
      badge={
        <>
          {account.Id === managementAccountId && <span className="fd-org-badge">management account</span>}
          {account.Status !== "ACTIVE" && <span className="fd-org-badge fd-org-badge--muted">{account.Status}</span>}
        </>
      }
      subtitle={`${account.Id} | ${account.Email}`}
      date={accountDateLabel(account)}
    />
  );
}

interface ContainerNodeProps extends SelectionProps {
  kind: "root" | "ou";
  id: string;
  name: string;
  depth: number;
  parentId?: string;
  defaultExpanded?: boolean;
}

/** Root or OU row; its child OUs and accounts load when expanded, like the console tree. */
export function ContainerNode({ kind, id, name, depth, parentId, defaultExpanded = false, ...sel }: ContainerNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const item: SelItem = { kind, id, name, parentId };
  const toggle = () => setExpanded((e) => !e);
  return (
    <>
      <TreeRow
        depth={depth}
        expander={{ expanded, onToggle: toggle, label: `${expanded ? "Collapse" : "Expand"} ${name}` }}
        control={<Checkbox checked={!!sel.selected[id]} ariaLabel={`Select ${name}`} onChange={() => sel.onToggle(item)} />}
        icon={<FolderIcon />}
        title={
          <button type="button" className="fd-org-name" onClick={toggle}>
            {name}
          </button>
        }
        subtitle={id}
      />
      {expanded && <ContainerChildren parentId={id} depth={depth + 1} {...sel} />}
    </>
  );
}

function ContainerChildren({ parentId, depth, ...sel }: SelectionProps & { parentId: string; depth: number }) {
  const ous = useOrgOUs(parentId);
  const accounts = useOrgAccounts(parentId);
  if (ous.isLoading || accounts.isLoading) {
    return <TreeRow depth={depth} icon={<Spinner />} title="Loading…" subtitle="" />;
  }
  const childOUs = ous.data?.organizationalUnits ?? [];
  const childAccounts = accounts.data?.accounts ?? [];
  return (
    <>
      {childOUs.map((ou) => (
        <ContainerNode key={ou.Id} kind="ou" id={ou.Id} name={ou.Name} depth={depth} parentId={parentId} {...sel} />
      ))}
      {childAccounts.map((a) => (
        <AccountRow key={a.Id} account={a} depth={depth} parentId={parentId} {...sel} />
      ))}
      {childOUs.length === 0 && childAccounts.length === 0 && (
        <TreeRow depth={depth} icon={null} title={<span className="fd-org-empty">No accounts or OUs</span>} subtitle="" />
      )}
    </>
  );
}

/** Radio-button tree of the root and OUs, used to pick a move destination. */
export function DestinationPicker({ rootId, rootName, value, onChange }: { rootId: string; rootName: string; value: string | null; onChange: (id: string, name: string) => void }) {
  return (
    <div className="fd-org-tree fd-org-tree--picker" role="radiogroup" aria-label="Destination">
      <PickerNode id={rootId} name={rootName} depth={0} value={value} onChange={onChange} defaultExpanded />
    </div>
  );
}

function PickerNode({ id, name, depth, value, onChange, defaultExpanded = false }: { id: string; name: string; depth: number; value: string | null; onChange: (id: string, name: string) => void; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <>
      <TreeRow
        depth={depth}
        expander={{ expanded, onToggle: () => setExpanded((e) => !e), label: `${expanded ? "Collapse" : "Expand"} ${name}` }}
        control={
          <input type="radio" name="fd-org-destination" aria-label={name} checked={value === id} onChange={() => onChange(id, name)} />
        }
        icon={<FolderIcon />}
        title={name}
        subtitle={id}
      />
      {expanded && <PickerChildren parentId={id} depth={depth + 1} value={value} onChange={onChange} />}
    </>
  );
}

function PickerChildren({ parentId, depth, value, onChange }: { parentId: string; depth: number; value: string | null; onChange: (id: string, name: string) => void }) {
  const ous = useOrgOUs(parentId);
  if (ous.isLoading) return <TreeRow depth={depth} icon={<Spinner />} title="Loading…" subtitle="" />;
  return (
    <>
      {(ous.data?.organizationalUnits ?? []).map((ou) => (
        <PickerNode key={ou.Id} id={ou.Id} name={ou.Name} depth={depth} value={value} onChange={onChange} />
      ))}
    </>
  );
}
