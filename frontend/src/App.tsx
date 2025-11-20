import "@/App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "@/components/pages/Signup";
import Login from "@/components/pages/Login";
import { ProtectedRoute } from "@/components/Layouts/ProtectedRoute";
import Dashboard from "@/components/pages/Dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import TransactionOverview from "@/components/pages/TransactionOverview";
import TransactionManagement from "@/components/pages/TransactionManagement";
import BudgetManagementView from "@/components/pages/BudgetManagementView";
function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions-overview"
            element={
              <ProtectedRoute>
                <TransactionOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-management"
            element={
              <ProtectedRoute>
                <TransactionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget-management"
            element={
              <ProtectedRoute>
                <BudgetManagementView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;
