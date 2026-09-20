import axios from "axios";

// Separate axios instance for the parent portal so a logged-in admin/staff
// session and a logged-in parent session never share (or overwrite) a token
// in the same browser.
const parentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

parentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("parentToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

parentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPasswordChange = error.config?.url?.includes("/change-password");
    if (error.response?.status === 401 && !isPasswordChange) {
      localStorage.removeItem("parentToken");
      localStorage.removeItem("parent");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?as=parent";
      }
    }
    return Promise.reject(error);
  }
);

export default parentApi;
