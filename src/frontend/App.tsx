import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayoutShell from "./components/AppLayoutShell";
import { ToastProvider } from "./components/Toast";
import DashboardHome from "./pages/DashboardHome";
import ServicePage from "./pages/ServicePage";
import S3Page from "./pages/S3Page";
import EC2Page from "./pages/EC2Page";
import SQSPage from "./pages/SQSPage";
import SNSPage from "./pages/SNSPage";
import EventsPage from "./pages/EventsPage";
import LambdaPage from "./pages/LambdaPage";
import CloudWatchPage from "./pages/CloudWatchPage";
import IAMPage from "./pages/IAMPage";
import SecretsManagerPage from "./pages/SecretsManagerPage";
import CloudFormationPage from "./pages/CloudFormationPage";
import KMSPage from "./pages/KMSPage";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <HashRouter>
          <AppLayoutShell>
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/services/s3" element={<S3Page />} />
              <Route path="/services/ec2" element={<EC2Page />} />
              <Route path="/services/sqs" element={<SQSPage />} />
              <Route path="/services/sns" element={<SNSPage />} />
              <Route path="/services/events" element={<EventsPage />} />
              <Route path="/services/lambda" element={<LambdaPage />} />
              <Route path="/services/cloudwatch" element={<CloudWatchPage />} />
              <Route path="/services/iam" element={<IAMPage />} />
              <Route path="/services/secretsmanager" element={<SecretsManagerPage />} />
              <Route path="/services/cloudformation" element={<CloudFormationPage />} />
              <Route path="/services/kms" element={<KMSPage />} />
              <Route path="/services/:service" element={<ServicePage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AppLayoutShell>
        </HashRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
