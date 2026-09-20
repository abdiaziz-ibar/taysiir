import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("parentToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/parent-portal/me");
        setParent(res.data.parent);
      } catch (err) {
        await AsyncStorage.removeItem("parentToken");
      } finally {
        setLoading(false);
      }
    })();
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

  return (
    <AuthContext.Provider value={{ parent, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
