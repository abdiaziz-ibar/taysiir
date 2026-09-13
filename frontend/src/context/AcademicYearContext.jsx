import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AcademicYearContext = createContext(null);

export const AcademicYearProvider = ({ children }) => {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(
    localStorage.getItem("selectedYearId") || ""
  );
  const [loading, setLoading] = useState(true);

  const refreshYears = async () => {
    const res = await api.get("/academic-years");
    setYears(res.data);
    const stillExists = res.data.some((y) => y._id === selectedYearId);
    if (!selectedYearId || !stillExists) {
      const active = res.data.find((y) => y.isActive) || res.data[0];
      if (active) {
        setSelectedYearId(active._id);
        localStorage.setItem("selectedYearId", active._id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSelectedYearId = (id) => {
    setSelectedYearId(id);
    localStorage.setItem("selectedYearId", id);
  };

  return (
    <AcademicYearContext.Provider
      value={{
        years,
        selectedYearId,
        setSelectedYearId: updateSelectedYearId,
        refreshYears,
        loading,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => useContext(AcademicYearContext);
