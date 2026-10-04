import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { t } from "../i18n";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/60">
        {t("Waa la soo shubayaa...")}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
