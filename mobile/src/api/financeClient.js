import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./client";

// The finance section's own client and token (like staffClient for system users).
const financeApi = axios.create({ baseURL: API_BASE });

let onUnauthorized = null;
export const setFinanceUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

financeApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("financeToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

financeApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Wrong passwords on these come back as 401 too, but must show the error, not end the session.
    const isPasswordCall = ["/finance-auth/login", "/finance-auth/verify-password", "/finance-auth/change-password"].some((u) =>
      error.config?.url?.includes(u)
    );
    if (error.response?.status === 401 && !isPasswordCall) {
      await AsyncStorage.removeItem("financeToken");
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Step-up confirmation used by the delete modals.
export const verifyFinancePassword = (password) => financeApi.post("/finance-auth/verify-password", { password });

export default financeApi;
