import { useState, useCallback } from "react";
import { Modal, Button, Box, SpaceBetween } from "@cloudscape-design/components";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  dismissText?: string;
  variant?: "primary" | "danger";
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    options: { title: "", message: "" },
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  };

  const handleDismiss = () => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false }));
  };

  const dialog = (
    <Modal
      visible={state.open}
      onDismiss={handleDismiss}
      header={state.options.title}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleDismiss}>
              {state.options.dismissText || "Cancel"}
            </Button>
            <Button
              variant={state.options.variant === "danger" ? "primary" : "primary"}
              onClick={handleConfirm}
            >
              {state.options.confirmText || "Confirm"}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Box variant="p">{state.options.message}</Box>
    </Modal>
  );

  return { confirm, dialog };
}
