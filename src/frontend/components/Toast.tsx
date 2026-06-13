import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Flashbar, type FlashbarProps } from "@cloudscape-design/components";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  content: string;
  dismissible?: boolean;
}

interface ToastContextValue {
  showToast: (type: ToastItem["type"], content: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastItem["type"], content: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev, { id, type, content, dismissible: true }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4000);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const flashbarItems: FlashbarProps.MessageDefinition[] = items.map((item) => ({
    id: item.id,
    type: item.type,
    content: item.content,
    dismissible: item.dismissible !== false,
    onDismiss: () => removeItem(item.id),
  }));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", top: 56, right: 20, zIndex: 9999, maxWidth: 400 }}>
        <Flashbar items={flashbarItems} />
      </div>
    </ToastContext.Provider>
  );
}
