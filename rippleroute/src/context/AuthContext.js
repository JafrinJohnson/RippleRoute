"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const SESSION_KEY = "rippleroute_auth_session";
const USERS_KEY = "rippleroute_mock_users";

// Default pre-seeded accounts for effortless testing and demo evaluations
const SEED_USERS = [
  {
    uid: "usr-admin-01",
    role: "admin",
    name: "Selvi Ramasamy",
    username: "admin01",
    email: "admin01@gmail.com",
    password: "password123",
    companyId: "KS-COV-99",
    department: "Logistics Team",
    phone: "9842100001",
    driverId: "",
    vehicleNumber: "",
    priority: "",
  },
  {
    uid: "usr-driver-01",
    role: "driver",
    name: "Karthik Raja",
    username: "drive01",
    email: "driver1@gmail.com",
    password: "password123",
    companyId: "KS-COV-99",
    department: "Delivery Team",
    phone: "9842123011",
    driverId: "DRV-3801",
    vehicleNumber: "TN 38 AB 1234",
    priority: "",
  },
  {
    uid: "usr-emg-01",
    role: "emergency",
    name: "Praveen Kumar",
    username: "emerg01",
    email: "emerg01@gmail.com",
    password: "password123",
    companyId: "KS-COV-99",
    department: "Logistics Team",
    phone: "9842188402",
    driverId: "EMG-9014",
    vehicleNumber: "TN 38 AL 9014",
    priority: "Medical – oxygen/medicines",
  },
];

const sleep = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Safe default context value with no-op async functions
const defaultAuthValue = {
  user: null,
  profile: null,
  loading: false,
  signup: async () => ({ ok: false, error: "AuthProvider not mounted" }),
  login: async () => ({ ok: false, error: "AuthProvider not mounted" }),
  logout: () => {},
};

export const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to read mock users safely from localStorage
  const getMockUsers = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
        return SEED_USERS;
      }
    } catch (err) {
      console.warn("Could not read mock users:", err);
    }
    return SEED_USERS;
  }, []);

  // Hydrate user session on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        getMockUsers(); // Initialize seeds if empty
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          setProfile(parsed);
        }
      }
    } catch (err) {
      console.warn("Could not read auth session:", err);
    } finally {
      setLoading(false);
    }
  }, [getMockUsers]);

  // Signup function: never throws, returns { ok: true, role } or { ok: false, error }
  const signup = useCallback(
    async (role, formData = {}) => {
      setLoading(true);
      try {
        await sleep(600); // simulate 600ms network delay per requirements

        const users = getMockUsers();
        const normalizedUsername = (formData.username || "").trim().toLowerCase();
        const normalizedEmail = (formData.email || formData.gmail || "").trim().toLowerCase();

        // Validate username uniqueness
        const usernameExists = users.some(
          (u) => (u.username || "").toLowerCase() === normalizedUsername
        );
        if (usernameExists) {
          return { ok: false, error: "Username is already registered. Please choose another." };
        }

        // Validate email uniqueness
        const emailExists = users.some(
          (u) => (u.email || "").toLowerCase() === normalizedEmail
        );
        if (emailExists) {
          return { ok: false, error: "Gmail address is already registered. Please login instead." };
        }

        const resolvedRole = role || "admin";
        const newProfile = {
          uid: `usr-${Date.now()}`,
          role: resolvedRole,
          name: formData.name || formData.fullName || "",
          username: formData.username || "",
          email: normalizedEmail,
          phone: formData.phone || "",
          companyId: formData.companyId || "",
          department: formData.department || "",
          driverId: formData.driverId || "",
          vehicleNumber: formData.vehicleNumber || "",
          priority: formData.priority || "",
          password: formData.password || "",
        };

        // Persist to localStorage
        try {
          if (typeof window !== "undefined") {
            const updatedUsers = [...users, newProfile];
            localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
            localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile));
          }
        } catch (storageErr) {
          console.warn("Could not save profile to localStorage:", storageErr);
        }

        setProfile(newProfile);
        return { ok: true, role: resolvedRole, profile: newProfile };
      } catch (err) {
        console.error("Signup error:", err);
        return { ok: false, error: err.message || "An unexpected error occurred during signup." };
      } finally {
        setLoading(false);
      }
    },
    [getMockUsers]
  );

  // Login function: never throws, returns { ok: true, role } or { ok: false, error }
  const login = useCallback(
    async (identifier, password) => {
      setLoading(true);
      try {
        await sleep(600); // simulate 600ms network delay per requirements

        const users = getMockUsers();
        const cleanId = (identifier || "").trim().toLowerCase();

        const matched = users.find(
          (u) =>
            (u.username || "").toLowerCase() === cleanId ||
            (u.email || "").toLowerCase() === cleanId
        );

        if (!matched) {
          return { ok: false, error: "No account found with this username or Gmail." };
        }

        if (matched.password && matched.password !== password) {
          return { ok: false, error: "Incorrect password. Please verify your credentials." };
        }

        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(SESSION_KEY, JSON.stringify(matched));
          }
        } catch (storageErr) {
          console.warn("Could not save session to localStorage:", storageErr);
        }

        setProfile(matched);
        return { ok: true, role: matched.role, profile: matched };
      } catch (err) {
        console.error("Login error:", err);
        return { ok: false, error: err.message || "Failed to authenticate session." };
      } finally {
        setLoading(false);
      }
    },
    [getMockUsers]
  );

  // Logout function
  const logout = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (err) {
      console.warn("Could not remove session from localStorage:", err);
    }
    setProfile(null);
  }, []);

  const user = profile
    ? {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.name,
        role: profile.role,
      }
    : null;

  const value = {
    user,
    profile,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
}
