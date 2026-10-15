import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("agri_token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("agri_token");
      const storedUser = localStorage.getItem("agri_user");

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await API.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem("agri_user", JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.warn("Session check failed, clearing local storage");
          localStorage.removeItem("agri_token");
          localStorage.removeItem("agri_user");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("agri_token", res.data.token);
        localStorage.setItem("agri_user", JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : error.message === "Network Error"
          ? "Cannot connect to server. Make sure the backend is running."
          : "Login failed. Please try again.");
      return { success: false, message };
    }
  };

  const register = async (formData) => {
    try {
      const res = await API.post("/auth/register", formData);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("agri_token", res.data.token);
        localStorage.setItem("agri_user", JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : error.message === "Network Error"
          ? "Cannot connect to server. Make sure the backend is running."
          : "Registration failed. Please try again.");
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_user");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("agri_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

