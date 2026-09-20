import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://taysiir.idraakict.com/api";
export const API_ORIGIN = "https://taysiir.idraakict.com";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("parentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
