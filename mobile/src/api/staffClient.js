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
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      await AsyncStorage.removeItem("staffToken");
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default staffApi;
