import { useState } from "react";
import { Modal, Form, FormField, Input, Button, SpaceBetween, Box } from "@cloudscape-design/components";

interface Field {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

interface Props {
  title: string;
  fields: Field[];
  visible: boolean;
  loading?: boolean;
  onDismiss: () => void;
  onSubmit: (data: Record<string, string>) => void;
}

export default function CreateModal({ title, fields, visible, loading, onDismiss, onSubmit }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({});
  };

  const handleDismiss = () => {
    setFormData({});
    onDismiss();
  };

  return (
    <Modal visible={visible} onDismiss={handleDismiss} header={title}>
      <Form>
        <SpaceBetween size="m">
          {fields.map((f) => (
            <FormField key={f.name} label={f.label}>
              <Input
                value={formData[f.name] || ""}
                onChange={({ detail }) => setFormData((prev) => ({ ...prev, [f.name]: detail.value }))}
                placeholder={f.placeholder}
              />
            </FormField>
          ))}
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={handleDismiss}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} loading={loading}>Create</Button>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}
