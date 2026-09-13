import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AcademicYearProvider } from "../context/AcademicYearContext";

const Layout = () => {
  return (
    <AcademicYearProvider>
      <div className="flex min-h-screen bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AcademicYearProvider>
  );
};

export default Layout;
