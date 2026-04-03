import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LanguageProvider } from "./hooks/useLanguage";
import "./index.css";
 
import LoginPage from "./pages/LoginPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import Layout from "./components/ui/Layout";
import DashboardPage from "./pages/DashboardPage";
import FarmersPage from "./pages/FarmersPage";
import MilkEntryPage from "./pages/MilkEntryPage";
import ReportsPage from "./pages/ReportsPage";
import PaymentsPage from "./pages/PaymentsPage";
import DuesPage from "./pages/DuesPage";
 
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
 
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-2">🐄</div><p className="text-gray-500">Loading...</p></div>
    </div>
  );
  // Admin login check — role must be "admin" not "superadmin"
  if (!admin || admin.role !== "admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
 
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl">🐄</div>
    </div>
  );
  if (!admin || admin.role !== "superadmin") return <Navigate to="/super/login" replace />;
  return <>{children}</>;
}
 
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/super/login" element={<SuperAdminLoginPage />} />
              <Route path="/super/dashboard" element={
                <SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute><Layout /></ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="farmers" element={<FarmersPage />} />
                <Route path="milk" element={<MilkEntryPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="dues" element={<DuesPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
 
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
 