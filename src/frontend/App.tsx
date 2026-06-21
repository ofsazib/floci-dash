import { lazy, Suspense, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayoutShell from "./components/AppLayoutShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider, useToast } from "./components/Toast";
import { setGlobalErrorReporter, clearGlobalErrorReporter } from "./lib/globalErrorHandler";
import { DashboardSkeleton } from "./components/LoadingSkeleton";
import DashboardHome from "./pages/DashboardHome";

// Lazy-loaded dedicated service pages — code-split at the route level
// so the initial bundle only contains the DashboardHome page.
// Vite will generate separate chunks for each lazy import.
const ServicePage = lazy(() => import("./pages/ServicePage"));
const S3Page = lazy(() => import("./pages/S3Page"));
const EC2Page = lazy(() => import("./pages/EC2Page"));
const SQSPage = lazy(() => import("./pages/SQSPage"));
const SNSPage = lazy(() => import("./pages/SNSPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const LambdaPage = lazy(() => import("./pages/LambdaPage"));
const CloudWatchPage = lazy(() => import("./pages/CloudWatchPage"));
const IAMPage = lazy(() => import("./pages/IAMPage"));
const SecretsManagerPage = lazy(() => import("./pages/SecretsManagerPage"));
const CloudFormationPage = lazy(() => import("./pages/CloudFormationPage"));
const KMSPage = lazy(() => import("./pages/KMSPage"));
const Settings = lazy(() => import("./pages/Settings"));

// TanStack Query DevTools — lazy-loaded via dynamic import in dev mode only.
// In production builds, Vite tree-shakes the entire import since the ternary
// evaluates to () => null at compile time.
const ReactQueryDevtoolsProduction = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : () => null;

// Errors are reported globally via the enhanced api() client, so TanStack Query
// defaultOptions don't need an onError handler here. Toast integration happens
// in ToastProviderWithErrorReporter below.
const queryClient = new QueryClient();

/**
 * Inner component that bridges the Toast context into the global error reporter
 * so that errors from `api()` calls and TanStack Query are automatically shown
 * as toasts.
 */
function ToastProviderWithErrorReporter({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const registered = useRef(false);

  useEffect(() => {
    setGlobalErrorReporter((message: string, context?: string) => {
      const label = context ? `[${context}] ` : "";
      showToast("error", `${label}${message}`);
    });
    registered.current = true;
    return () => {
      clearGlobalErrorReporter();
      registered.current = false;
    };
  }, [showToast]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* TanStack Query DevTools — only visible in dev mode. In production,
          ReactQueryDevtoolsProduction is () => null and fully tree-shaken.
          Wrapped in Suspense because dev mode uses a lazy() component. */}
      <Suspense fallback={null}>
        <ReactQueryDevtoolsProduction buttonPosition="bottom-right" />
      </Suspense>
      <ToastProvider>
        <ToastProviderWithErrorReporter>
          <HashRouter>
            <AppLayoutShell>
              <ErrorBoundary>
                <Suspense fallback={<DashboardSkeleton />}>
                  <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/services/s3" element={<S3Page />} />
                    <Route path="/services/ec2" element={<EC2Page />} />
                    <Route path="/services/sqs" element={<SQSPage />} />
                    <Route path="/services/sns" element={<SNSPage />} />
                    <Route path="/services/events" element={<EventsPage />} />
                    <Route path="/services/lambda" element={<LambdaPage />} />
                    <Route path="/services/cloudwatch" element={<CloudWatchPage />} />
                    <Route path="/services/monitoring" element={<CloudWatchPage />} />
                    <Route path="/services/iam" element={<IAMPage />} />
                    <Route path="/services/secretsmanager" element={<SecretsManagerPage />} />
                    <Route path="/services/cloudformation" element={<CloudFormationPage />} />
                    <Route path="/services/kms" element={<KMSPage />} />
                    <Route path="/services/:service" element={<ServicePage />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AppLayoutShell>
          </HashRouter>
        </ToastProviderWithErrorReporter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
