/**
 * RippleRoute — Demo Data Seeder
 * Writes the standard 8 Coimbatore deliveries and 3 arterial hazards into Firestore
 * ONLY if the deliveries collection is completely empty.
 */

import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { INITIAL_DELIVERIES, INITIAL_HAZARDS, mockStore } from "@/services/mockStore";

export async function seedDemoData() {
  if (!db) {
    if (mockStore && Array.isArray(mockStore.deliveries) && mockStore.deliveries.length === 0) {
      mockStore.deliveries = JSON.parse(JSON.stringify(INITIAL_DELIVERIES));
      mockStore.hazards = JSON.parse(JSON.stringify(INITIAL_HAZARDS));
      return { ok: true, created: INITIAL_DELIVERIES.length + INITIAL_HAZARDS.length };
    }
    return { ok: true, created: 0, reason: "already_seeded" };
  }

  try {
    // 1. Check if deliveries collection already has documents
    const deliveriesRef = collection(db, "deliveries");
    const existingSnap = await getDocs(deliveriesRef);

    if (!existingSnap.empty) {
      return { ok: true, created: 0, reason: "already_seeded" };
    }

    let createdCount = 0;

    // 2. Seed 8 Coimbatore Deliveries from mockStore
    for (const del of INITIAL_DELIVERIES) {
      const delDocRef = doc(db, "deliveries", del.id);
      await setDoc(delDocRef, {
        code: del.code,
        customerName: del.customerName,
        customerPhone: del.customerPhone,
        address: del.address,
        lat: del.lat,
        lng: del.lng,
        cargo: del.cargo,
        priority: del.priority,
        status: del.status,
        assignedTo: del.assignedTo || null,
        etaText: del.etaText || "",
        updatedAt: serverTimestamp(),
      });
      createdCount++;
    }

    // 3. Seed 3 Coimbatore Hazards from mockStore
    for (const haz of INITIAL_HAZARDS) {
      const hazDocRef = doc(db, "hazards", haz.id);
      await setDoc(hazDocRef, {
        type: haz.type,
        lat: haz.lat,
        lng: haz.lng,
        radiusM: haz.radiusM,
        severity: haz.severity,
        note: haz.note,
        active: true,
        createdBy: "system",
        createdByName: haz.reportedBy || "Control Room Dispatch",
        createdAt: serverTimestamp(),
      });
      createdCount++;
    }

    return { ok: true, created: createdCount };
  } catch (err) {
    console.error("[seedDemoData] error seeding Firestore:", err);
    return { ok: false, error: err?.message || String(err), created: 0 };
  }
}
