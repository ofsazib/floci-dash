import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { BreadcrumbGroupProps, SideNavigationProps } from "@cloudscape-design/components";

/**
 * A service-specific side navigation, as the AWS console shows inside a service
 * (e.g. "AWS Organizations" → AWS accounts / Policies / Settings). Pages register
 * one with `useServiceNavigation`; without it the shell shows the global service list.
 */
export interface ServiceNavigation {
  header: { text: string; href: string };
  items: SideNavigationProps.Item[];
  activeHref: string;
  onFollow: (href: string) => void;
  /** Extra content under the links, e.g. the grey "Organization ID" block. */
  footer?: ReactNode;
}

interface ShellState {
  serviceNav: ServiceNavigation | null;
  setServiceNav: (nav: ServiceNavigation | null) => void;
  breadcrumbs: BreadcrumbGroupProps.Item[] | null;
  setBreadcrumbs: (items: BreadcrumbGroupProps.Item[] | null) => void;
}

const ShellContext = createContext<ShellState>({
  serviceNav: null,
  setServiceNav: () => {},
  breadcrumbs: null,
  setBreadcrumbs: () => {},
});

export function ShellProvider({ children }: { children: ReactNode }) {
  const [serviceNav, setServiceNav] = useState<ServiceNavigation | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbGroupProps.Item[] | null>(null);
  return (
    <ShellContext.Provider value={{ serviceNav, setServiceNav, breadcrumbs, setBreadcrumbs }}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  return useContext(ShellContext);
}

/** Registers a service side navigation while the calling page is mounted. Pass a memoized value. */
export function useServiceNavigation(nav: ServiceNavigation | null) {
  const { setServiceNav } = useShell();
  useEffect(() => {
    setServiceNav(nav);
    return () => setServiceNav(null);
  }, [nav, setServiceNav]);
}

/** Shows breadcrumbs above the page content (AppLayout breadcrumbs slot). Pass a memoized value. */
export function useBreadcrumbs(items: BreadcrumbGroupProps.Item[] | null) {
  const { setBreadcrumbs } = useShell();
  useEffect(() => {
    setBreadcrumbs(items);
    return () => setBreadcrumbs(null);
  }, [items, setBreadcrumbs]);
}
