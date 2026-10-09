/**
 * RippleRoute — In-Memory Mock Store
 * Contains seed data for Coimbatore logistics operations and in-memory mutable state.
 * Only src/services/api.js should import this module directly.
 */

import { buildPath, pointAtDistance, advanceRouteDistance } from "@/lib/routeAnimator";
import { getRoadRoutes } from "@/lib/roadRouting";
import demoRoutesData from "@/data/demoRoutes.json";

// Peelamedu Primary Depot reference
export const DEPOT_PEELAMEDU = {
  lat: 11.0270,
  lng: 77.0100,
  name: "Peelamedu Central Depot",
  address: "Avinashi Road, Peelamedu, Coimbatore - 641004",
};

// Initial Seed Deliveries (8 Coimbatore destinations from Peelamedu depot)
// 2 medical (oxygen cylinders, insulin cold box); 2 food (dairy, vegetables); 4 normal
export const INITIAL_DELIVERIES = [
  {
    id: "del-01",
    code: "DEL-GANDHI-01",
    customerName: "Sundaram Textiles & Spares",
    customerPhone: "+91 98421 88201",
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    lat: 11.0168,
    lng: 76.9670,
    cargo: "Textile Machinery Precision Spares",
    priority: "normal",
    status: "in_transit",
    assignedTo: "sim-drv-01",
    etaText: "by 4:35 PM",
  },
  {
    id: "del-02",
    code: "DEL-MED-RSP-02",
    customerName: "Kovai Diabetes & Life Care Clinic",
    customerPhone: "+91 98432 77112",
    address: "Diwan Bahadur (DB) Road, RS Puram, Coimbatore",
    lat: 11.0080,
    lng: 76.9450,
    cargo: "Insulin Cold Box & Biologics",
    priority: "medical",
    status: "open",
    assignedTo: null,
    etaText: "by 4:50 PM",
  },
  {
    id: "del-03",
    code: "DEL-FOOD-SBC-03",
    customerName: "Arogya Organic Fresh Dairy",
    customerPhone: "+91 98411 44552",
    address: "NSR Road, Saibaba Colony, Coimbatore",
    lat: 11.0330,
    lng: 76.9480,
    cargo: "Fresh Farm Dairy, Paneer & Butter",
    priority: "food",
    status: "in_transit",
    assignedTo: "sim-drv-04",
    etaText: "by 4:45 PM",
  },
  {
    id: "del-04",
    code: "DEL-SINGA-04",
    customerName: "Roots Auto Industries Ltd",
    customerPhone: "+91 98420 33910",
    address: "Trichy Road, Singanallur, Coimbatore",
    lat: 10.9980,
    lng: 77.0260,
    cargo: "Automotive Precision Castings",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "by 5:15 PM",
  },
  {
    id: "del-05",
    code: "DEL-FOOD-UKK-05",
    customerName: "Coimbatore Hydroponic Greens Mart",
    customerPhone: "+91 98444 11200",
    address: "Ukkadam Market Road, Coimbatore",
    lat: 10.9910,
    lng: 76.9620,
    cargo: "Fresh Hydroponic Leafy Vegetables",
    priority: "food",
    status: "open",
    assignedTo: null,
    etaText: "by 5:00 PM",
  },
  {
    id: "del-06",
    code: "DEL-TOWN-06",
    customerName: "Vasantham Hardware & Electric",
    customerPhone: "+91 98433 99881",
    address: "Oppanakara Street, Town Hall, Coimbatore",
    lat: 10.9970,
    lng: 76.9600,
    cargo: "Commercial Hardware & Fasteners",
    priority: "normal",
    status: "in_transit",
    assignedTo: "sim-drv-02",
    etaText: "by 5:10 PM",
  },
  {
    id: "del-07",
    code: "DEL-POL-07",
    customerName: "Annamalai Agro Processing Hub",
    customerPhone: "+91 98425 66770",
    address: "Palakkad Road Industrial Zone, Pollachi",
    lat: 10.6580,
    lng: 77.0080,
    cargo: "Industrial Electronics & Sensor Modules",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "by 6:20 PM",
  },
  {
    id: "del-08",
    code: "DEL-MED-MTP-08",
    customerName: "Mettupalayam Government Hospital",
    customerPhone: "+91 98450 11999",
    address: "Ooty Main Road, Mettupalayam, Nilgiris Foothills",
    lat: 11.2990,
    lng: 76.9420,
    cargo: "Liquid Medical Oxygen Cylinders",
    priority: "medical",
    status: "delayed",
    assignedTo: "sim-drv-03",
    etaText: "by 5:55 PM (Delayed)",
    lastNotifiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    notifiedVia: "whatsapp",
  },
];

// Initial Seed Hazards (3 specified hazards)
export const INITIAL_HAZARDS = [
  {
    id: "haz-landslide-01",
    type: "landslide",
    lat: 11.3170,
    lng: 76.9070,
    radiusM: 1500,
    severity: "critical",
    note: "Landslide-risk zone on the Mettupalayam–Kallar ghat road",
    reportedBy: "Highways & Police Patrol",
    active: true,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: "haz-roadblock-02",
    type: "roadblock",
    lat: 10.9925,
    lng: 76.9610,
    radiusM: 300,
    severity: "high",
    note: "Roadblock near Ukkadam bypass due to pipeline maintenance",
    reportedBy: "Coimbatore Municipal Corp",
    active: true,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: "haz-rain-03",
    type: "rain",
    lat: 11.0180,
    lng: 76.9750,
    radiusM: 800,
    severity: "medium",
    note: "Waterlogging and heavy rain near the Avinashi Road flyover",
    reportedBy: "Traffic Advisory Unit",
    active: true,
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
];

/**
 * Creates straight line fallback path between two coordinates
 */
function makeStraightPath(from, to, steps = 25) {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coords.push([
      from.lat + (to.lat - from.lat) * t,
      from.lng + (to.lng - from.lng) * t,
    ]);
  }
  return buildPath(coords);
}

// In-memory store state
class MockStore {
  constructor() {
    this.deliveries = JSON.parse(JSON.stringify(INITIAL_DELIVERIES));
    this.hazards = JSON.parse(JSON.stringify(INITIAL_HAZARDS));
    this.liveLocations = new Map();
    this.messages = [];
    this.smsLogs = [
      {
        id: "log-init-01",
        deliveryCode: "DEL-MED-MTP-08",
        customerName: "Mettupalayam Government Hospital",
        to: "+91 98450 11999",
        body: "Hi Mettupalayam Govt Hospital, your KovaiSwift order DEL-MED-MTP-08 is delayed due to landslide near Kallar pass. Our driver is taking a safer route. Assured arrival: by 5:55 PM today. – KovaiSwift Logistics",
        ok: true,
        sid: "WA_init_01",
        channel: "whatsapp",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ];
    this.smsSubscribers = new Set();
    this.routeOverrides = new Map();
    this.routeOverrideSubscribers = new Map(); // uid -> Set<cb>

    // Initialize 4 simulated drivers requested for the control room
    this.simulatedDrivers = new Map();
    this.initSimulatedFleet();
  }

  initSimulatedFleet() {
    const rawFleet = [
      {
        uid: "sim-drv-01",
        driverId: "DRV-4521",
        name: "Murugan K",
        vehicleNumber: "TN 38 BX 4521",
        phone: "+91 98421 45210",
        role: "driver",
        priority: "normal",
        status: "on_time",
        speedKmh: 42,
        cargo: "Textile Machinery Precision Spares",
        deliveryId: "del-01",
        deliveryCode: "DEL-GANDHI-01",
        destination: "Cross Cut Road, Gandhipuram",
        destinationCoords: { lat: 11.0168, lng: 76.9670 },
        currentDistM: 1200,
      },
      {
        uid: "sim-drv-02",
        driverId: "DRV-1180",
        name: "Arun S",
        vehicleNumber: "TN 37 CD 1180",
        phone: "+91 98432 11800",
        role: "driver",
        priority: "normal",
        status: "on_time",
        speedKmh: 38,
        cargo: "Commercial Hardware & Fasteners",
        deliveryId: "del-06",
        deliveryCode: "DEL-TOWN-06",
        destination: "Oppanakara Street, Town Hall",
        destinationCoords: { lat: 10.9970, lng: 76.9600 },
        currentDistM: 2800,
      },
      {
        uid: "sim-drv-03",
        driverId: "DRV-7790",
        name: "Priya R",
        vehicleNumber: "TN 38 AZ 7790",
        phone: "+91 98440 77900",
        role: "emergency",
        priority: "medical",
        status: "delayed", // near landslide zone
        speedKmh: 56,
        cargo: "Liquid Medical Oxygen Cylinders",
        deliveryId: "del-08",
        deliveryCode: "DEL-MED-MTP-08",
        destination: "Mettupalayam Government Hospital",
        destinationCoords: { lat: 11.2990, lng: 76.9420 },
        currentDistM: 8500,
      },
      {
        uid: "sim-drv-04",
        driverId: "DRV-3302",
        name: "Karthik V",
        vehicleNumber: "TN 66 F 3302",
        phone: "+91 98411 33020",
        role: "emergency",
        priority: "food",
        status: "at_risk",
        speedKmh: 45,
        cargo: "Fresh Farm Dairy, Paneer & Butter",
        deliveryId: "del-03",
        deliveryCode: "DEL-FOOD-SBC-03",
        destination: "NSR Road, Saibaba Colony",
        destinationCoords: { lat: 11.0330, lng: 76.9480 },
        currentDistM: 2100,
      },
    ];

    for (const d of rawFleet) {
      // Use real pre-saved road route from demoRoutes.json
      const savedRoute = demoRoutesData[d.deliveryId];
      const roadCoords = savedRoute?.coords;
      const roadPath = roadCoords && roadCoords.length >= 2
        ? buildPath(roadCoords)
        : makeStraightPath(DEPOT_PEELAMEDU, d.destinationCoords);

      const offsetDist = d.currentDistM % Math.max(1, roadPath.totalDistance);
      const initialPt = pointAtDistance(roadPath, offsetDist);

      this.simulatedDrivers.set(d.uid, {
        ...d,
        path: roadPath,
        currentDistM: offsetDist,
        totalDistanceM: roadPath.totalDistance,
        progress: roadPath.totalDistance > 0 ? offsetDist / roadPath.totalDistance : 0,
        etaMinutes: Math.max(1, Math.round(((roadPath.totalDistance - offsetDist) / (d.speedKmh * 1000 / 60)) / 2.5)),
        lat: initialPt.lat,
        lng: initialPt.lng,
        heading: initialPt.heading,
        updatedAt: Date.now(),
      });
    }

    // Start simulation ticker (1 second movement along real road routes)
    this.startSimulationTicker();
  }

  startSimulationTicker() {
    if (this._simTicker) return;

    this._simTicker = setInterval(() => {
      try {
        for (const driver of this.simulatedDrivers.values()) {
          if (!driver.path || driver.path.totalDistance <= 0) continue;

          driver.currentDistM = advanceRouteDistance(
            driver.currentDistM,
            driver.speedKmh,
            3.0, // 3x demo multiplier for visible smooth movement
            1,
            driver.path.totalDistance,
            true
          );

          const pt = pointAtDistance(driver.path, driver.currentDistM);
          driver.lat = pt.lat;
          driver.lng = pt.lng;
          driver.heading = pt.heading;
          driver.updatedAt = Date.now();
          driver.progress = driver.path.totalDistance > 0 ? driver.currentDistM / driver.path.totalDistance : 0;
          const remainingM = Math.max(0, driver.path.totalDistance - driver.currentDistM);
          driver.etaMinutes = Math.max(1, Math.round(remainingM / (driver.speedKmh * 1000 / 60) / 3.0));
        }
      } catch (err) {
        console.error("[mockStore] sim ticker error:", err);
      }
    }, 1000);

    // Unref timer in Node environment so Next.js build never hangs
    if (typeof this._simTicker?.unref === "function") {
      this._simTicker.unref();
    }
  }

  getDeliveries() {
    return JSON.parse(JSON.stringify(this.deliveries));
  }

  subscribeDeliveries(cb) {
    if (typeof cb !== "function") return () => {};
    cb(this.getDeliveries());
    const intervalId = setInterval(() => {
      try {
        cb(this.getDeliveries());
      } catch (err) {
        console.error("[subscribeDeliveries] callback error:", err);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }

  updateDelivery(id, patch) {
    const idx = this.deliveries.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.deliveries[idx] = { ...this.deliveries[idx], ...patch };
      return true;
    }
    return false;
  }

  getHazards() {
    return JSON.parse(JSON.stringify(this.hazards));
  }

  addHazard(data) {
    const id = data.id || `haz-${Date.now()}`;
    const newHazard = {
      id,
      type: data.type || "accident",
      lat: Number(data.lat),
      lng: Number(data.lng),
      radiusM: Number(data.radiusM) || 300,
      severity: data.severity || "high",
      note: data.note || "Field hazard reported by driver",
      reportedBy: data.reportedBy || "Control Room Dispatch",
      active: true,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    this.hazards.push(newHazard);
    return id;
  }

  resolveHazard(id) {
    const idx = this.hazards.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.hazards[idx].active = false;
      return true;
    }
    return false;
  }

  updateLiveLocation(profile, loc) {
    const uid = profile?.uid || profile?.id || "unknown";
    this.liveLocations.set(uid, {
      uid,
      name: profile?.name || "Driver",
      vehicleNumber: profile?.vehicleNumber || "TN-37-XX",
      phone: profile?.phone || "",
      role: profile?.role || "driver",
      priority: profile?.priority || "normal",
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      heading: Number(loc.heading) || 0,
      status: loc.status || "active",
      destination: loc.destination || null,
      progress: Number(loc.progress) || 0,
      etaMinutes: Number(loc.etaMinutes) || 0,
      remainingM: Number(loc.remainingM) || 0,
      updatedAt: Date.now(),
    });
    return true;
  }

  // ---- Route overrides (control room -> driver) ----
  setRouteOverride(uid, data) {
    const entry = { ...data, createdAt: Date.now(), acknowledged: false };
    this.routeOverrides.set(uid, entry);
    this._notifyRouteOverride(uid);
    return true;
  }

  subscribeRouteOverride(uid, cb) {
    if (typeof cb !== "function" || !uid) return () => {};
    if (!this.routeOverrideSubscribers.has(uid)) {
      this.routeOverrideSubscribers.set(uid, new Set());
    }
    this.routeOverrideSubscribers.get(uid).add(cb);
    const cur = this.routeOverrides.get(uid);
    cb(cur ? JSON.parse(JSON.stringify(cur)) : null);
    return () => {
      this.routeOverrideSubscribers.get(uid)?.delete(cb);
    };
  }

  acknowledgeRouteOverride(uid) {
    const cur = this.routeOverrides.get(uid);
    if (!cur) return false;
    this.routeOverrides.set(uid, { ...cur, acknowledged: true });
    this._notifyRouteOverride(uid);
    return true;
  }

  _notifyRouteOverride(uid) {
    const subs = this.routeOverrideSubscribers.get(uid);
    if (!subs) return;
    const cur = this.routeOverrides.get(uid);
    const payload = cur ? JSON.parse(JSON.stringify(cur)) : null;
    for (const cb of subs) {
      try {
        cb(payload);
      } catch (e) {
        console.error("[_notifyRouteOverride] callback error:", e);
      }
    }
  }

  /**
   * Re-run a simulated demo truck on a new road route (local only, no Firestore).
   * coords: [[lat,lng], ...] real road geometry starting at the truck's position.
   */
  rerouteSimulatedDriver(uid, coords) {
    const driver = this.simulatedDrivers.get(uid);
    if (!driver || !Array.isArray(coords) || coords.length < 2) return false;
    const path = buildPath(coords);
    if (!path || path.totalDistance <= 0) return false;
    driver.path = path;
    driver.currentDistM = 0;
    driver.totalDistanceM = path.totalDistance;
    driver.progress = 0;
    driver.status = "on_time";
    const pt = pointAtDistance(path, 0);
    driver.lat = pt.lat;
    driver.lng = pt.lng;
    driver.heading = pt.heading;
    driver.updatedAt = Date.now();
    return true;
  }

  getLiveLocations() {
    const combined = new Map();

    // 1. Add all simulated drivers
    for (const [uid, driver] of this.simulatedDrivers.entries()) {
      combined.set(uid, {
        uid: driver.uid,
        driverId: driver.driverId,
        name: driver.name,
        vehicleNumber: driver.vehicleNumber,
        phone: driver.phone,
        role: driver.role,
        priority: driver.priority,
        status: driver.status,
        speedKmh: driver.speedKmh,
        cargo: driver.cargo,
        deliveryId: driver.deliveryId,
        deliveryCode: driver.deliveryCode,
        destination: driver.destination,
        destinationCoords: driver.destinationCoords,
        lat: driver.lat,
        lng: driver.lng,
        heading: driver.heading,
        currentDistM: driver.currentDistM,
        totalDistanceM: driver.totalDistanceM,
        progress: driver.progress,
        etaMinutes: driver.etaMinutes,
        updatedAt: driver.updatedAt,
      });
    }

    // 2. Merge any real logged-in users
    for (const [uid, loc] of this.liveLocations.entries()) {
      combined.set(uid, { ...loc });
    }

    return Array.from(combined.values());
  }

  subscribeLiveLocations(cb) {
    if (typeof cb !== "function") return () => {};
    cb(this.getLiveLocations());
    const intervalId = setInterval(() => {
      try {
        cb(this.getLiveLocations());
      } catch (err) {
        console.error("[subscribeLiveLocations] callback error:", err);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }

  addMessage(fromUid, toUid, text) {
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fromUid,
      toUid,
      text,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  getMessages(uid) {
    return this.messages.filter(
      (m) =>
        m.fromUid === uid ||
        m.toUid === uid ||
        m.toUid === "admin" ||
        m.toUid === "all" ||
        uid === "admin"
    );
  }

  logSms(entry) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      to: entry.to || "",
      body: entry.body || "",
      deliveryCode: entry.deliveryCode || "",
      ok: Boolean(entry.ok),
      sid: entry.sid || "",
      error: entry.error || "",
      channel: entry.channel || "whatsapp",
      by: entry.by || "admin",
      createdAt: entry.createdAt || new Date().toISOString(),
    };
    this.smsLogs.unshift(log);
    this._notifySmsLogs();
    return log;
  }

  subscribeSmsLogs(cb) {
    if (typeof cb !== "function") return () => {};
    cb([...this.smsLogs]);
    this.smsSubscribers.add(cb);
    return () => this.smsSubscribers.delete(cb);
  }

  _notifySmsLogs() {
    for (const cb of this.smsSubscribers) {
      try {
        cb([...this.smsLogs]);
      } catch (e) {
        console.error("[_notifySmsLogs] callback error:", e);
      }
    }
  }
}

// Singleton in-memory store
export const mockStore = new MockStore();
