import { Navigate, Outlet } from "react-router-dom";
import useIdleLogout from "../hooks/useIdleLogout";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of no activity

// Guards the finance section: needs a finance login (financeToken), and ends
// the session after an hour of no activity like the other logins.
const FinanceProtectedRoute = () => {
  const token = localStorage.getItem("financeToken");

  useIdleLogout(!!token, IDLE_TIMEOUT_MS, () => {
    localStorage.removeItem("financeToken");
    localStorage.removeItem("finance");
    window.location.href = "/login?as=finance&expired=1";
  });

  if (!token) return <Navigate to="/login?as=finance" replace />;
  return <Outlet />;
};

export default FinanceProtectedRoute;
