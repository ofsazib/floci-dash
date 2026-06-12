import { useState } from "react";
import { Button, Modal, Box, SpaceBetween } from "@cloudscape-design/components";

interface Props {
  itemName: string;
  resourceType: string;
  loading?: boolean;
  onDelete: () => void;
}

export default function DeleteButton({ itemName, resourceType, loading, onDelete }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button variant="icon" iconName="remove" onClick={() => setVisible(true)} ariaLabel={`Delete ${itemName}`} />
      <Modal visible={visible} onDismiss={() => setVisible(false)} header={`Delete ${resourceType}`}>
        <Box>
          <p>Are you sure you want to delete <b>{itemName}</b>?</p>
          <p>This action cannot be undone.</p>
        </Box>
        <Box float="right" padding={{ top: "m" }}>
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setVisible(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { onDelete(); setVisible(false); }} loading={loading}>
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      </Modal>
    </>
  );
}
