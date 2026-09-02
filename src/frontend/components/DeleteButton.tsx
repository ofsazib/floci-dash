import { useState } from "react";
import { Button } from "@cloudscape-design/components";
import { useConfirmDialog } from "./ConfirmDialog";

interface Props {
  itemName: string;
  resourceType: string;
  loading?: boolean;
  onDelete: () => void | Promise<unknown>;
}

export default function DeleteButton({ itemName, resourceType, loading, onDelete }: Props) {
  const { confirm, dialog } = useConfirmDialog();
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    const ok = await confirm({
      title: `Delete ${resourceType}`,
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="icon" iconName="remove" onClick={handleClick} disabled={loading || deleting} ariaLabel={`Delete ${itemName}`} />
      {dialog}
    </>
  );
}
