import axios from "axios";

// Separate axios instance for the finance section (payroll + expenses), like
// parentAxios: its own token, so a finance login and a system-user login in
// the same browser never share or overwrite each other.
const financeApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

financeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("financeToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

financeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // A wrong password on these also comes back 401 but must show the error, not end the session.
    const isPasswordCall = ["/finance-auth/verify-password", "/finance-auth/change-password"].some((u) =>
      error.config?.url?.includes(u)
    );
    if (error.response?.status === 401 && !isPasswordCall) {
      localStorage.removeItem("financeToken");
      localStorage.removeItem("finance");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?as=finance";
      }
    }
    return Promise.reject(error);
  }
);

// Step-up confirmation used by the delete modals.
export const verifyFinancePassword = (password) => financeApi.post("/finance-auth/verify-password", { password });

export default financeApi;
