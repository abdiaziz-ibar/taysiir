import { createContext, useContext, useEffect, useState } from "react";
import staffApi from "../api/staffClient";

const StaffContext = createContext(null);

export const StaffProvider = ({ children }) => {
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");

  useEffect(() => {
    staffApi.get("/academic-years").then((res) => {
      setYears(res.data);
      const active = res.data.find((y) => y.isActive) || res.data[0];
      if (active) setSelectedYearId(active._id);
    });
  }, []);

  return (
    <StaffContext.Provider value={{ years, selectedYearId, setSelectedYearId }}>{children}</StaffContext.Provider>
  );
};

export const useStaff = () => useContext(StaffContext);
