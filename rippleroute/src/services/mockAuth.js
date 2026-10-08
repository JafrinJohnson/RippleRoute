"use client";

const SESSION_KEY = "rippleroute_auth_session";
const USERS_KEY = "rippleroute_mock_users";

export const SEED_USERS = [
  {
    uid: "usr-admin-01",
    role: "admin",
    name: "Selvi Ramasamy",
    username: "admin01",
    email: "admin01@gmail.com",
    password: "password123",
    companyId: "KS-COV-99",
    department: "Logistics Team",
    phone: "+919842100001",
    driverId: "",
    vehicleNumber: "",
    priority: "",
    isDemo: false,
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
    phone: "+919842123011",
    driverId: "DRV-3801",
    vehicleNumber: "TN 38 AB 1234",
    priority: "",
    isDemo: false,
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
    phone: "+919842188402",
    driverId: "EMG-9014",
    vehicleNumber: "TN 38 AL 9014",
    priority: "medical",
    isDemo: false,
  },
];

export const DEMO_PROFILES = {
  admin: {
    uid: "demo-admin-01",
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
    uid: "demo-driver-01",
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
    uid: "demo-emg-01",
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

const sleep = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export function getMockUsers() {
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
}

export function getMockSession() {
  try {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        return JSON.parse(session);
      }
    }
  } catch (err) {
    console.warn("Could not read auth session:", err);
  }
  return null;
}

export function setMockSession(profile) {
  try {
    if (typeof window !== "undefined") {
      if (profile) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  } catch (err) {
    console.warn("Could not update mock session:", err);
  }
}

export async function mockSignup(role, formData = {}) {
  await sleep(400);
  const users = getMockUsers();
  const normalizedUsername = (formData.username || "").trim().toLowerCase();
  const normalizedEmail = (formData.email || formData.gmail || "").trim().toLowerCase();

  const usernameExists = users.some(
    (u) => (u.username || "").toLowerCase() === normalizedUsername
  );
  if (usernameExists) {
    return { ok: false, error: "usernameTaken" };
  }

  const emailExists = users.some(
    (u) => (u.email || "").toLowerCase() === normalizedEmail
  );
  if (emailExists) {
    return { ok: false, error: "auth/email-already-in-use" };
  }

  const rawPhone = (formData.phone || "").replace(/\D/g, "").slice(-10);
  const formattedPhone = rawPhone ? `+91${rawPhone}` : "";

  const resolvedRole = role || "admin";
  const newProfile = {
    uid: `usr-${Date.now()}`,
    role: resolvedRole,
    name: formData.name || formData.fullName || "",
    username: normalizedUsername,
    email: normalizedEmail,
    phone: formattedPhone,
    companyId: formData.companyId || "",
    department: formData.department || "",
    driverId: formData.driverId || "",
    vehicleNumber: (formData.vehicleNumber || "").toUpperCase().trim(),
    priority: formData.priority || "",
    isDemo: false,
  };

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newProfile]));
      setMockSession(newProfile);
    }
  } catch (err) {
    console.warn("Failed saving mock user:", err);
  }

  return { ok: true, role: resolvedRole, profile: newProfile };
}

export async function mockLogin(identifier, password) {
  await sleep(400);
  const users = getMockUsers();
  const cleanId = (identifier || "").trim().toLowerCase();

  const matched = users.find(
    (u) =>
      (u.username || "").toLowerCase() === cleanId ||
      (u.email || "").toLowerCase() === cleanId
  );

  if (!matched) {
    return { ok: false, error: "userNotFound" };
  }

  if (matched.password && matched.password !== password) {
    return { ok: false, error: "auth/wrong-password" };
  }

  setMockSession(matched);
  return { ok: true, role: matched.role, profile: matched };
}

export async function mockLoginDemo(role = "admin") {
  await sleep(200);
  const targetRole = (role || "admin").toLowerCase();
  const demoProfile = DEMO_PROFILES[targetRole] || DEMO_PROFILES.admin;
  setMockSession(demoProfile);
  return { ok: true, role: demoProfile.role, profile: demoProfile };
}

export function mockLogout() {
  setMockSession(null);
}
