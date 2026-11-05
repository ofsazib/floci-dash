import { AttributeEditor, Input } from "@cloudscape-design/components";

export interface TagRow {
  key: string;
  value: string;
}

const MAX_TAGS = 50;

/** Key/value tag list with "Add tag", as on the AWS console create pages. */
export default function TagsEditor({ tags, onChange }: { tags: TagRow[]; onChange: (tags: TagRow[]) => void }) {
  const set = (i: number, patch: Partial<TagRow>) => onChange(tags.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <AttributeEditor
      items={tags}
      addButtonText="Add tag"
      removeButtonText="Remove"
      onAddButtonClick={() => onChange([...tags, { key: "", value: "" }])}
      onRemoveButtonClick={({ detail }) => onChange(tags.filter((_, j) => j !== detail.itemIndex))}
      disableAddButton={tags.length >= MAX_TAGS}
      empty="No tags are associated with the resource."
      additionalInfo={`You can add ${MAX_TAGS - tags.length} more tags.`}
      definition={[
        { label: "Key", control: (t, i) => <Input value={t.key} ariaLabel={`Tag key ${i + 1}`} onChange={({ detail }) => set(i, { key: detail.value })} /> },
        { label: "Value - optional", control: (t, i) => <Input value={t.value} ariaLabel={`Tag value ${i + 1}`} onChange={({ detail }) => set(i, { value: detail.value })} /> },
      ]}
    />
  );
}

/** Rows with a key, as the record the backend expects. */
export function tagsToRecord(tags: TagRow[]): Record<string, string> | undefined {
  const rows = tags.filter((t) => t.key.trim());
  return rows.length ? Object.fromEntries(rows.map((t) => [t.key.trim(), t.value])) : undefined;
}
