import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";
import staffApi, { setStaffUnauthorizedHandler } from "../api/staffClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [parent, setParent] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStaffUnauthorizedHandler(() => setStaff(null));

    const restoreParent = async () => {
      const token = await AsyncStorage.getItem("parentToken");
      if (!token) return;
      try {
        const res = await api.get("/parent-portal/me");
        setParent(res.data.parent);
      } catch (err) {
        await AsyncStorage.removeItem("parentToken");
      }
    };

    const restoreStaff = async () => {
      const token = await AsyncStorage.getItem("staffToken");
      if (!token) return;
      try {
        const res = await staffApi.get("/auth/me");
        setStaff(res.data.user);
      } catch (err) {
        await AsyncStorage.removeItem("staffToken");
      }
    };

    Promise.all([restoreParent(), restoreStaff()]).finally(() => setLoading(false));
  }, []);

  const login = async (phone, password) => {
    const res = await api.post("/parent-portal/login", { phone, password });
    await AsyncStorage.setItem("parentToken", res.data.token);
    setParent(res.data.parent);
    return res.data.parent;
  };

  const register = async (phone, password) => {
    const res = await api.post("/parent-portal/register", { phone, password });
    await AsyncStorage.setItem("parentToken", res.data.token);
    setParent(res.data.parent);
    return res.data.parent;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("parentToken");
    setParent(null);
  };

  const staffLogin = async (username, password) => {
    const res = await staffApi.post("/auth/login", { username, password });
    await AsyncStorage.setItem("staffToken", res.data.token);
    setStaff(res.data.user);
    return res.data.user;
  };

  const staffLogout = async () => {
    await AsyncStorage.removeItem("staffToken");
    setStaff(null);
  };

  return (
    <AuthContext.Provider value={{ parent, staff, loading, login, register, logout, staffLogin, staffLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
