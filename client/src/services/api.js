import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  timeout: 12000,
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("agri_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for session expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        localStorage.removeItem("agri_token");
        localStorage.removeItem("agri_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;

