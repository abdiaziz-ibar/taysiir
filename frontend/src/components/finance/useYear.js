import { useEffect, useState } from "react";
import api from "../../api/financeAxios";
import { currentStartYear } from "../../utils/finance";

// Loads the month-by-month overview of one school year (September → August).
const useYear = (initial = currentStartYear()) => {
  const [startYear, setStartYear] = useState(initial);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get("/finance/year", { params: { startYear } }).then((res) => setData(res.data));
  }, [startYear]);

  return { startYear, setStartYear, data };
};

export default useYear;
