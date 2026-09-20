import { createContext, useCallback, useContext, useEffect, useState } from "react";
import staffApi from "../api/staffClient";

const StaffContext = createContext(null);

export const StaffProvider = ({ children }) => {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");

  const refreshYears = useCallback(async () => {
    const res = await staffApi.get("/academic-years");
    setYears(res.data);
    setSelectedYearId((prev) => {
      if (prev && res.data.some((y) => y._id === prev)) return prev;
      return (res.data.find((y) => y.isActive) || res.data[0])?._id || "";
    });
  }, []);

  useEffect(() => {
    refreshYears();
  }, [refreshYears]);

  return (
    <StaffContext.Provider value={{ years, selectedYearId, setSelectedYearId, refreshYears }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => useContext(StaffContext);
