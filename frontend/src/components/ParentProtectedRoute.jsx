import { Navigate, Outlet } from "react-router-dom";

const ParentProtectedRoute = () => {
  const token = localStorage.getItem("parentToken");
  if (!token) return <Navigate to="/login?as=parent" replace />;
  return <Outlet />;
};

export default ParentProtectedRoute;
