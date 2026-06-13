import { useState } from "react";
import { Button, Modal, Box, SpaceBetween, Alert } from "@cloudscape-design/components";

interface Props {
  itemName: string;
  resourceType: string;
  loading?: boolean;
  onDelete: () => void | Promise<unknown>;
}

export default function DeleteButton({ itemName, resourceType, loading, onDelete }: Props) {
  const [visible, setVisible] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setInternalLoading(true);
    try {
      await onDelete();
      setVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <>
      <Button variant="icon" iconName="remove" onClick={() => { setVisible(true); setError(null); }} ariaLabel={`Delete ${itemName}`} />
      <Modal
        visible={visible}
        onDismiss={() => setVisible(false)}
        header={`Delete ${resourceType}`}
        size="small"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setVisible(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleDelete} loading={loading || internalLoading}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box variant="p">Are you sure you want to delete <b>{itemName}</b>?</Box>
        <Box variant="p">This action cannot be undone.</Box>
        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}
      </Modal>
    </>
  );
}
