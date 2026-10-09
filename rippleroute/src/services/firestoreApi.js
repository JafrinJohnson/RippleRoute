/**
 * RippleRoute — Firestore API Implementation
 *
 * Direct Firestore service layer using modular Firebase SDK.
 * Used by src/services/api.js when isFirebaseConfigured is true.
 */

import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { mockStore } from "./mockStore";

/**
 * Safely converts Firestore Timestamp / Date / string / number to epoch milliseconds.
 * Returns Date.now() if null or pending write.
 */
function toMillis(val) {
  if (!val) return Date.now();
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

/**
 * Normalizes document data by attaching id and converting timestamps to milliseconds.
 */
function normalizeDocData(id, data) {
  if (!data) return { id };
  const res = { ...data, id };
  if ("createdAt" in res) res.createdAt = toMillis(res.createdAt);
  if ("updatedAt" in res) res.updatedAt = toMillis(res.updatedAt);
  if ("resolvedAt" in res) res.resolvedAt = toMillis(res.resolvedAt);
  return res;
}

// =========================================================================
// 1. DELIVERIES
// =========================================================================

export async function getDeliveries() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, "deliveries"));
    return snap.docs.map((d) => normalizeDocData(d.id, d.data()));
  } catch (err) {
    console.warn("[firestoreApi] getDeliveries error:", err);
    return [];
  }
}

export function subscribeDeliveries(cb) {
  if (typeof cb !== "function") return () => {};
  if (!db) {
    cb([]);
    return () => {};
  }

  try {
    const unsub = onSnapshot(
      collection(db, "deliveries"),
      (snapshot) => {
        const items = snapshot.docs.map((d) => normalizeDocData(d.id, d.data()));
        cb(items);
      },
      (err) => {
        console.warn("[firestoreApi] subscribeDeliveries error:", err);
        cb([]);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("[firestoreApi] subscribeDeliveries setup error:", err);
    cb([]);
    return () => {};
  }
}

export async function updateDelivery(id, patch) {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    const ref = doc(db, "deliveries", id);
    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    console.warn("[firestoreApi] updateDelivery error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// =========================================================================
// 2. HAZARDS
// =========================================================================

export async function getHazards() {
  if (!db) return [];
  try {
    const q = query(collection(db, "hazards"), where("active", "==", true));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => normalizeDocData(d.id, d.data()));
    items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    return items;
  } catch (err) {
    console.warn("[firestoreApi] getHazards error:", err);
    return [];
  }
}

export function subscribeHazards(cb) {
  if (typeof cb !== "function") return () => {};
  if (!db) {
    cb([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "hazards"), where("active", "==", true));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => normalizeDocData(d.id, d.data()));
        items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        cb(items);
      },
      (err) => {
        console.warn("[firestoreApi] subscribeHazards error:", err);
        cb([]);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("[firestoreApi] subscribeHazards setup error:", err);
    cb([]);
    return () => {};
  }
}

export async function addHazard(data) {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    const createdBy = data.createdBy || auth?.currentUser?.uid || "admin";
    const createdByName = data.createdByName || auth?.currentUser?.displayName || "Operator";

    const docRef = await addDoc(collection(db, "hazards"), {
      type: data.type || "accident",
      lat: Number(data.lat),
      lng: Number(data.lng),
      radiusM: Number(data.radiusM) || 300,
      severity: data.severity || "high",
      note: data.note || "",
      active: true,
      createdBy,
      createdByName,
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: docRef.id };
  } catch (err) {
    console.warn("[firestoreApi] addHazard error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function resolveHazard(id) {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    const ref = doc(db, "hazards", id);
    await updateDoc(ref, {
      active: false,
      resolvedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    console.warn("[firestoreApi] resolveHazard error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// =========================================================================
// 3. LIVE LOCATIONS (ADMIN ONLY)
// =========================================================================

export async function updateLiveLocation(profile, pos) {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    const uid = profile?.uid || profile?.id || auth?.currentUser?.uid || "unknown";
    const ref = doc(db, "liveLocations", uid);
    await setDoc(
      ref,
      {
        uid,
        name: profile?.name || "Driver",
        vehicleNumber: profile?.vehicleNumber || "",
        role: profile?.role || "driver",
        priority: profile?.priority || "normal",
        phone: profile?.phone || "",
        lat: Number(pos.lat),
        lng: Number(pos.lng),
        heading: Number(pos.heading) || 0,
        status: pos.status || "active",
        destination: pos.destination || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (err) {
    console.warn("[firestoreApi] updateLiveLocation error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export function subscribeLiveLocations(cb) {
  if (typeof cb !== "function") return () => {};
  if (!db) {
    return mockStore.subscribeLiveLocations(cb);
  }

  let latestRealUsers = [];

  const emitMerged = () => {
    try {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      // Drop entries older than 2 minutes
      const activeRealUsers = latestRealUsers.filter(
        (u) => toMillis(u.updatedAt) >= twoMinutesAgo
      );

      // Simulated moving demo trucks from mockStore
      const simDrivers = Array.from(mockStore.simulatedDrivers.values()).map((d) => ({
        uid: d.uid,
        driverId: d.driverId,
        name: d.name,
        vehicleNumber: d.vehicleNumber,
        phone: d.phone,
        role: d.role,
        priority: d.priority,
        status: d.status,
        speedKmh: d.speedKmh,
        cargo: d.cargo,
        deliveryId: d.deliveryId,
        deliveryCode: d.deliveryCode,
        destination: d.destination,
        destinationCoords: d.destinationCoords,
        lat: d.lat,
        lng: d.lng,
        heading: d.heading,
        currentDistM: d.currentDistM,
        totalDistanceM: d.totalDistanceM,
        progress: d.progress,
        etaMinutes: d.etaMinutes,
        updatedAt: toMillis(d.updatedAt),
      }));

      const realUids = new Set(activeRealUsers.map((u) => u.uid));
      const realVehicles = new Set(
        activeRealUsers.map((u) => (u.vehicleNumber || "").toUpperCase()).filter(Boolean)
      );

      const demoAccountUids = new Set([
        "demo-admin-01",
        "demo-driver-01",
        "demo-emg-01",
      ]);

      const merged = [...activeRealUsers];
      for (const sim of simDrivers) {
        const isDuplicateUid = realUids.has(sim.uid) || demoAccountUids.has(sim.uid);
        const isDuplicateVehicle = realVehicles.has((sim.vehicleNumber || "").toUpperCase());
        if (!isDuplicateUid && !isDuplicateVehicle) {
          merged.push(sim);
        }
      }

      cb(merged);
    } catch (err) {
      console.warn("[firestoreApi] emitMerged error:", err);
      cb([]);
    }
  };

  let firestoreUnsub = () => {};
  try {
    const coll = collection(db, "liveLocations");
    firestoreUnsub = onSnapshot(
      coll,
      (snapshot) => {
        latestRealUsers = snapshot.docs.map((d) => normalizeDocData(d.id, d.data()));
        emitMerged();
      },
      (err) => {
        console.warn("[firestoreApi] subscribeLiveLocations error:", err);
        emitMerged();
      }
    );
  } catch (err) {
    console.warn("[firestoreApi] subscribeLiveLocations setup error:", err);
    emitMerged();
  }

  // Simulation movement ticker (1 sec) so moving trucks stay animated
  const ticker = setInterval(() => {
    emitMerged();
  }, 1000);

  return () => {
    try {
      firestoreUnsub();
    } catch (_) {}
    clearInterval(ticker);
  };
}

// =========================================================================
// 4. MESSAGES & DISPATCH COMMS
// =========================================================================

export async function sendMessage(fromUid, toUid, text, fromName = "") {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    const targetToUid = toUid || "admin";
    await addDoc(collection(db, "messages"), {
      fromUid,
      fromName: fromName || auth?.currentUser?.displayName || "",
      toUid: targetToUid,
      text: text || "",
      participants: [fromUid, targetToUid],
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    console.warn("[firestoreApi] sendMessage error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export function subscribeMessages(uid, cb) {
  if (typeof cb !== "function") return () => {};
  if (!db) {
    cb([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => normalizeDocData(d.id, d.data()));
        items.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
        cb(items);
      },
      (err) => {
        console.warn("[firestoreApi] subscribeMessages error:", err);
        cb([]);
      }
    );
    return unsub;
  } catch (err) {
    console.warn("[firestoreApi] subscribeMessages setup error:", err);
    cb([]);
    return () => {};
  }
}

// =========================================================================
// 5. SMS LOGGING
// =========================================================================

export async function logSms({ to, body, deliveryCode, ok, sid, error, by, channel }) {
  if (!db) return { ok: false, error: "Database not configured" };
  try {
    await addDoc(collection(db, "smsLogs"), {
      to: to || "",
      body: body || "",
      deliveryCode: deliveryCode || "",
      ok: Boolean(ok),
      sid: sid || "",
      error: error || "",
      channel: channel || "sms",
      by: by || auth?.currentUser?.uid || "admin",
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    console.warn("[firestoreApi] logSms error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export function subscribeSmsLogs(cb) {
  if (!db) {
    cb([]);
    return () => {};
  }
  const q = collection(db, "smsLogs");
  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      cb(logs);
    },
    (err) => {
      console.warn("[firestoreApi] subscribeSmsLogs error:", err);
      cb([]);
    }
  );
}

