import { useState, type ReactNode } from "react";
import { Box, Button, FormField, Input, Modal, SpaceBetween } from "@cloudscape-design/components";

interface Props {
  visible: boolean;
  header: string;
  children: ReactNode;
  /** The text the user must type to enable the confirm button (AWS console pattern). */
  confirmValue: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function TypedConfirmModal({ visible, header, children, confirmValue, confirmLabel, loading, onConfirm, onDismiss }: Props) {
  const [typed, setTyped] = useState("");
  const close = () => {
    setTyped("");
    onDismiss();
  };
  return (
    <Modal
      visible={visible}
      onDismiss={close}
      header={header}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={close}>Cancel</Button>
            <Button
              variant="primary"
              disabled={typed !== confirmValue}
              loading={loading}
              onClick={() => {
                setTyped("");
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box variant="div">{children}</Box>
        <FormField label={<>To confirm, enter <b>{confirmValue}</b> in the field.</>}>
          <Input value={typed} onChange={({ detail }) => setTyped(detail.value)} placeholder={confirmValue} ariaLabel="Confirmation" />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
