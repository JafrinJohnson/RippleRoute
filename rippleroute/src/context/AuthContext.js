"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isFirebaseConfigured, auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getMockSession,
  mockSignup,
  mockLogin,
  mockLoginDemo,
  mockLogout,
  DEMO_PROFILES,
} from "@/services/mockAuth";

// Demo profile configurations for Firebase
const DEMO_FIREBASE_PROFILES = {
  admin: {
    role: "admin",
    name: "Kavya S",
    username: "kavyaad",
    email: "demo.admin@rippleroute.app",
    companyId: "KS-CBE-01",
    department: "Logistics Team",
    phone: "+919842100001",
    driverId: "",
    vehicleNumber: "",
    priority: "",
    isDemo: true,
  },
  driver: {
    role: "driver",
    name: "Murugan K",
    username: "murugan",
    email: "demo.driver@rippleroute.app",
    companyId: "KS-CBE-01",
    department: "Delivery Team",
    phone: "+919842104521",
    driverId: "DRV-4521",
    vehicleNumber: "TN 38 BX 4521",
    priority: "",
    isDemo: true,
  },
  emergency: {
    role: "emergency",
    name: "Priya R",
    username: "priyar1",
    email: "demo.emergency@rippleroute.app",
    companyId: "KS-CBE-01",
    department: "Emergency Medical Fleet",
    phone: "+919842107790",
    driverId: "EMG-7790",
    vehicleNumber: "TN 38 AZ 7790",
    priority: "medical",
    isDemo: true,
  },
};

function mapFirebaseError(code) {
  if (!code) return "auth/invalid-credential";
  switch (code) {
    case "auth/email-already-in-use":
      return "auth/email-already-in-use";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "auth/invalid-credential";
    case "auth/wrong-password":
      return "auth/wrong-password";
    case "auth/user-not-found":
      return "auth/user-not-found";
    case "auth/weak-password":
      return "auth/weak-password";
    case "auth/network-request-failed":
      return "auth/network-request-failed";
    case "auth/too-many-requests":
      return "auth/too-many-requests";
    case "permission-denied":
      return "permission-denied";
    case "usernameTaken":
      return "usernameTaken";
    case "userNotFound":
      return "userNotFound";
    default:
      return code;
  }
}

const defaultAuthValue = {
  user: null,
  profile: null,
  loading: false,
  signup: async () => ({ ok: false, error: "AuthProvider not mounted" }),
  login: async () => ({ ok: false, error: "AuthProvider not mounted" }),
  loginDemo: async (role = "admin") => ({
    ok: true,
    role,
    profile: DEMO_PROFILES[role] || DEMO_PROFILES.admin,
  }),
  logout: async () => {},
};

export const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication State Listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      const mockSession = getMockSession();
      if (mockSession) {
        setProfile(mockSession);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            const cleanProfile = {
              uid: firebaseUser.uid,
              role: data.role || "admin",
              name: data.name || "",
              username: data.username || "",
              email: data.email || firebaseUser.email || "",
              phone: data.phone || "",
              companyId: data.companyId || "",
              department: data.department || "",
              driverId: data.driverId || "",
              vehicleNumber: data.vehicleNumber || "",
              priority: data.priority || "",
              isDemo: Boolean(data.isDemo),
            };
            setProfile(cleanProfile);
          } else {
            setProfile({
              uid: firebaseUser.uid,
              role: "admin",
              name: firebaseUser.displayName || "Operator",
              username: "",
              email: firebaseUser.email || "",
              phone: "",
              companyId: "",
              department: "",
              driverId: "",
              vehicleNumber: "",
              priority: "",
              isDemo: false,
            });
          }
        } catch (err) {
          console.warn("Firestore user profile fetch warning:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Signup: lowercase username; check uniqueness; create auth user; setDoc users/{uid} & usernames/{username}
  const signup = useCallback(async (role, formData = {}) => {
    setLoading(true);
    if (!isFirebaseConfigured || !auth || !db) {
      try {
        const res = await mockSignup(role, formData);
        if (res.ok && res.profile) {
          setProfile(res.profile);
        }
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const rawUsername = formData.username || "";
      const username = rawUsername.trim().toLowerCase();
      const rawEmail = formData.email || formData.gmail || "";
      const email = rawEmail.trim().toLowerCase();
      const password = formData.password || "";

      // 1. Check if usernames/{username} already exists
      const usernameDocRef = doc(db, "usernames", username);
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        return { ok: false, error: "usernameTaken" };
      }

      // 2. Format phone and vehicle number
      const rawPhone = (formData.phone || "").replace(/\D/g, "").slice(-10);
      const phone = rawPhone ? `+91${rawPhone}` : "";
      const vehicleNumber = (formData.vehicleNumber || "").trim().toUpperCase();

      // 3. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const resolvedRole = role || "admin";
      const newProfile = {
        uid,
        role: resolvedRole,
        name: formData.name || formData.fullName || "",
        username,
        email,
        phone,
        companyId: formData.companyId || "",
        department: formData.department || "",
        driverId: formData.driverId || "",
        vehicleNumber,
        priority: formData.priority || "",
        isDemo: false,
      };

      // 4. Save to users/{uid} with serverTimestamp()
      await setDoc(doc(db, "users", uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
      });

      // 5. Save username mapping in usernames/{username}
      await setDoc(usernameDocRef, {
        uid,
        email,
      });

      setProfile(newProfile);
      return { ok: true, role: resolvedRole, profile: newProfile };
    } catch (err) {
      console.error("Firebase signup error:", err);
      const mappedErr = mapFirebaseError(err?.code);
      return { ok: false, error: mappedErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login: if identifier has no "@", resolve via usernames/{identifier} to email; signIn; load users/{uid}
  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    if (!isFirebaseConfigured || !auth || !db) {
      try {
        const res = await mockLogin(identifier, password);
        if (res.ok && res.profile) {
          setProfile(res.profile);
        }
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const cleanId = (identifier || "").trim();
      let emailToAuth = cleanId;

      if (!cleanId.includes("@")) {
        const lowerUsername = cleanId.toLowerCase();
        const usernameSnap = await getDoc(doc(db, "usernames", lowerUsername));
        if (!usernameSnap.exists()) {
          return { ok: false, error: "userNotFound" };
        }
        const uData = usernameSnap.data();
        if (!uData || !uData.email) {
          return { ok: false, error: "userNotFound" };
        }
        emailToAuth = uData.email;
      }

      const userCred = await signInWithEmailAndPassword(auth, emailToAuth, password);
      const uid = userCred.user.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        return { ok: false, error: "userNotFound" };
      }

      const data = userSnap.data();
      const loadedProfile = {
        uid,
        role: data.role || "admin",
        name: data.name || "",
        username: data.username || "",
        email: data.email || emailToAuth,
        phone: data.phone || "",
        companyId: data.companyId || "",
        department: data.department || "",
        driverId: data.driverId || "",
        vehicleNumber: data.vehicleNumber || "",
        priority: data.priority || "",
        isDemo: Boolean(data.isDemo),
      };

      setProfile(loadedProfile);
      return { ok: true, role: loadedProfile.role, profile: loadedProfile };
    } catch (err) {
      console.error("Firebase login error:", err);
      const mappedErr = mapFirebaseError(err?.code);
      return { ok: false, error: mappedErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fast 1-click Demo Login using real Firebase demo accounts
  const loginDemo = useCallback(async (role = "admin") => {
    setLoading(true);
    if (!isFirebaseConfigured || !auth || !db) {
      try {
        const res = await mockLoginDemo(role);
        if (res.ok && res.profile) {
          setProfile(res.profile);
        }
        return res;
      } finally {
        setLoading(false);
      }
    }

    try {
      const targetRole = (role || "admin").toLowerCase();
      const demoEmail =
        targetRole === "driver"
          ? "demo.driver@rippleroute.app"
          : targetRole === "emergency"
          ? "demo.emergency@rippleroute.app"
          : "demo.admin@rippleroute.app";
      const demoPassword = "RippleDemo#2026";
      const demoTemplate = DEMO_FIREBASE_PROFILES[targetRole] || DEMO_FIREBASE_PROFILES.admin;

      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (signInErr) {
        const code = signInErr?.code || "";
        if (
          code === "auth/invalid-credential" ||
          code === "auth/user-not-found" ||
          code === "auth/invalid-login-credentials" ||
          code.includes("not-found") ||
          code.includes("invalid-credential")
        ) {
          // Account doesn't exist yet on this Firebase project; seed it
          userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        } else {
          throw signInErr;
        }
      }

      const uid = userCred.user.uid;
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);

      const demoProfile = {
        ...demoTemplate,
        uid,
        isDemo: true,
      };

      if (!snap.exists()) {
        await setDoc(userDocRef, {
          ...demoProfile,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, "usernames", demoTemplate.username), {
          uid,
          email: demoEmail,
        });
      } else {
        const existingData = snap.data();
        Object.assign(demoProfile, existingData, { uid, isDemo: true });
      }

      setProfile(demoProfile);
      return { ok: true, role: demoProfile.role, profile: demoProfile };
    } catch (err) {
      console.error("Firebase loginDemo error:", err);
      const mappedErr = mapFirebaseError(err?.code);
      return { ok: false, error: mappedErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout: delete liveLocations/{uid} in try/catch, then signOut
  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !db) {
      mockLogout();
      setProfile(null);
      return;
    }

    try {
      const currentUid = auth.currentUser?.uid || profile?.uid;
      if (currentUid && db) {
        try {
          await deleteDoc(doc(db, "liveLocations", currentUid));
        } catch (locErr) {
          console.warn("Could not delete liveLocation on logout:", locErr);
        }
      }
      await signOut(auth);
    } catch (err) {
      console.error("Firebase logout error:", err);
    } finally {
      setProfile(null);
    }
  }, [profile?.uid]);

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
    loginDemo,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
}
