import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// EXPO_PUBLIC_API_ORIGIN lets a local build (e.g. a web preview) point at another backend.
export const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN || "https://taysiir.idraakict.com";
export const API_BASE = `${API_ORIGIN}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("parentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
