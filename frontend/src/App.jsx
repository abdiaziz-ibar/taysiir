import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Parents from "./pages/Parents";
import ParentDetail from "./pages/ParentDetail";
import Fees from "./pages/Fees";
import Payments from "./pages/Payments";
import PaymentNew from "./pages/PaymentNew";
import PaymentDetail from "./pages/PaymentDetail";
import Debts from "./pages/Debts";
import MonthlyReport from "./pages/reports/MonthlyReport";
import YearlyReport from "./pages/reports/YearlyReport";
import AllYearsReport from "./pages/reports/AllYearsReport";
import DebtsReport from "./pages/reports/DebtsReport";
import AcademicYears from "./pages/AcademicYears";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/parents" element={<Parents />} />
          <Route path="/parents/:id" element={<ParentDetail />} />

          <Route path="/fees" element={<Fees />} />

          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/new" element={<PaymentNew />} />
          <Route path="/payments/:id" element={<PaymentDetail />} />

          <Route path="/debts" element={<Debts />} />

          <Route path="/reports/monthly" element={<MonthlyReport />} />
          <Route path="/reports/yearly" element={<YearlyReport />} />
          <Route path="/reports/all-years" element={<AllYearsReport />} />
          <Route path="/reports/debts" element={<DebtsReport />} />

          <Route path="/academic-years" element={<AcademicYears />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
