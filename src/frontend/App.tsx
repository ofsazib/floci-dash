import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayoutShell from "./components/AppLayoutShell";
import DashboardHome from "./pages/DashboardHome";
import ServicePage from "./pages/ServicePage";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppLayoutShell>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/services/:service" element={<ServicePage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayoutShell>
      </HashRouter>
    </QueryClientProvider>
  );
}
