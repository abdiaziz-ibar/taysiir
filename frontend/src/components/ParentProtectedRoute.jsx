import { Navigate, Outlet } from "react-router-dom";
import useIdleLogout from "../hooks/useIdleLogout";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of no activity

const ParentProtectedRoute = () => {
  const token = localStorage.getItem("parentToken");

  useIdleLogout(!!token, IDLE_TIMEOUT_MS, () => {
    localStorage.removeItem("parentToken");
    localStorage.removeItem("parent");
    window.location.href = "/login?as=parent&expired=1";
  });

  if (!token) return <Navigate to="/login?as=parent" replace />;
  return <Outlet />;
};

export default ParentProtectedRoute;
