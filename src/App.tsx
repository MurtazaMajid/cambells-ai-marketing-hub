import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import OverviewPage from "@/pages/index";
import AnalysisPage from "@/pages/analysis";
import CustomersPage from "@/pages/customers";
import GeneratePage from "@/pages/generate";
import MessagesPage from "@/pages/messages";
import SentimentPage from "@/pages/sentiment";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
