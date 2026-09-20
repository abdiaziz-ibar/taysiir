import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./client";

const staffApi = axios.create({ baseURL: API_BASE });

let onUnauthorized = null;
export const setStaffUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

staffApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("staffToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

staffApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Wrong passwords on these come back as 401 too, but must show the
    // error, not end the session.
    const isPasswordCall = ["/auth/login", "/auth/verify-password", "/auth/change-password"].some((u) =>
      error.config?.url?.includes(u)
    );
    if (error.response?.status === 401 && !isPasswordCall) {
      await AsyncStorage.removeItem("staffToken");
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default staffApi;
