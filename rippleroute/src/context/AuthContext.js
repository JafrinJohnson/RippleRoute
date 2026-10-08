"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "rippleroute_auth_session";

// Default demo users for instant testing across roles
const DEMO_USERS = {
  admin: {
    uid: "usr-admin-01",
    email: "dispatcher@kovaiswift.com",
    displayName: "Selvi Ramasamy (Operations Chief)",
    role: "admin",
    organization: "KovaiSwift Logistics",
  },
  driver: {
    uid: "usr-drv-01",
    email: "karthik@kovaiswift.com",
    displayName: "Karthik Raja",
    role: "driver",
    vehicleId: "TN-37-BY-4512",
    organization: "KovaiSwift Logistics",
  },
  emergency: {
    uid: "usr-emg-02",
    email: "praveen.med@kovaiswift.com",
    displayName: "Praveen Kumar (Emergency Medical)",
    role: "emergency",
    vehicleId: "TN-38-AL-9014",
    organization: "KovaiSwift Emergency Cargo",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user session safely from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed);
        } else {
          // Default to admin for seamless hackathon presentation
          setUser(DEMO_USERS.admin);
        }
      }
    } catch (err) {
      console.warn("Could not read auth session from localStorage:", err);
      setUser(DEMO_USERS.admin);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (role = "admin") => {
    setLoading(true);
    try {
      const selected = DEMO_USERS[role] || DEMO_USERS.admin;
      setUser(selected);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      }
      return { success: true, user: selected };
    } catch (err) {
      console.error("Login failure:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      return { success: true };
    } catch (err) {
      console.error("Logout failure:", err);
      return { success: false, error: err.message };
    }
  };

  const switchRole = (role) => {
    return login(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "admin",
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
