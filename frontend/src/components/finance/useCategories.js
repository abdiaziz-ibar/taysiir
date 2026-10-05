import { useCallback, useEffect, useState } from "react";
import api from "../../api/financeAxios";
import { EXPENSE_CATEGORIES } from "../../utils/finance";

// The expense types the finance team manages. `names` are the active ones in order (with "Kale"
// last), falling back to the standard list until the server answers.
const useCategories = () => {
  const [all, setAll] = useState(null);

  const reload = useCallback(
    () =>
      api
        .get("/expense-categories")
        .then((res) => setAll(res.data))
        .catch(() => {}),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const active = (all || []).filter((c) => c.isActive).map((c) => c.name);
  const names = all ? [...active.filter((n) => n !== "Kale"), "Kale"] : EXPENSE_CATEGORIES;
  return { all, names, reload };
};

export default useCategories;
