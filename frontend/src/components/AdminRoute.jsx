import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Payroll and expenses are admin-only (the API enforces it too); this just
// keeps non-admins from landing on a page that can only show errors.
const AdminRoute = () => {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export default AdminRoute;
