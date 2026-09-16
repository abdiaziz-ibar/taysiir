import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AcademicYearProvider } from "../context/AcademicYearContext";
import { useAuth } from "../context/AuthContext";
import useIdleLogout from "../hooks/useIdleLogout";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useIdleLogout(IDLE_TIMEOUT_MS, () => {
    logout();
    navigate("/login?expired=1", { replace: true });
  });

  return (
    <AcademicYearProvider>
      <div className="flex min-h-screen bg-paper print:block">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
            <Outlet />
          </main>
        </div>
      </div>
    </AcademicYearProvider>
  );
};

export default Layout;
