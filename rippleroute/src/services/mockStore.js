/**
 * RippleRoute — In-Memory Mock Store
 * Contains seed data for Coimbatore logistics operations and in-memory mutable state.
 * Only src/services/api.js should import this module directly.
 */

// Peelamedu Primary Depot reference
export const DEPOT_PEELAMEDU = {
  lat: 11.0270,
  lng: 77.0100,
  name: "Peelamedu Central Depot",
  address: "Avinashi Road, Peelamedu, Coimbatore - 641004",
};

// Initial Seed Deliveries (8 Coimbatore destinations from Peelamedu depot)
// 2 medical (oxygen cylinders, insulin cold box); 2 food (dairy, vegetables); 4 normal
const INITIAL_DELIVERIES = [
  {
    id: "del-01",
    code: "DEL-GANDHI-01",
    customerName: "Sundaram Textiles & Spares",
    customerPhone: "+910000000000",
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    lat: 11.0168,
    lng: 76.9670,
    cargo: "Textile Machinery Precision Spares",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "18 mins",
  },
  {
    id: "del-02",
    code: "DEL-MED-RSP-02",
    customerName: "Kovai Diabetes & Life Care Clinic",
    customerPhone: "+910000000000",
    address: "Diwan Bahadur (DB) Road, RS Puram, Coimbatore",
    lat: 11.0080,
    lng: 76.9450,
    cargo: "Insulin Cold Box & Biologics",
    priority: "medical",
    status: "open",
    assignedTo: null,
    etaText: "24 mins",
  },
  {
    id: "del-03",
    code: "DEL-FOOD-SBC-03",
    customerName: "Arogya Organic Fresh Dairy",
    customerPhone: "+910000000000",
    address: "NSR Road, Saibaba Colony, Coimbatore",
    lat: 11.0330,
    lng: 76.9480,
    cargo: "Fresh Farm Dairy, Paneer & Butter",
    priority: "food",
    status: "open",
    assignedTo: null,
    etaText: "20 mins",
  },
  {
    id: "del-04",
    code: "DEL-SINGA-04",
    customerName: "Roots Auto Industries Ltd",
    customerPhone: "+910000000000",
    address: "Trichy Road, Singanallur, Coimbatore",
    lat: 10.9980,
    lng: 77.0260,
    cargo: "Automotive Precision Castings",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "16 mins",
  },
  {
    id: "del-05",
    code: "DEL-FOOD-UKK-05",
    customerName: "Coimbatore Hydroponic Greens Mart",
    customerPhone: "+910000000000",
    address: "Ukkadam Market Road, Coimbatore",
    lat: 10.9910,
    lng: 76.9620,
    cargo: "Fresh Hydroponic Leafy Vegetables",
    priority: "food",
    status: "open",
    assignedTo: null,
    etaText: "22 mins",
  },
  {
    id: "del-06",
    code: "DEL-TOWN-06",
    customerName: "Vasantham Hardware & Electric",
    customerPhone: "+910000000000",
    address: "Oppanakara Street, Town Hall, Coimbatore",
    lat: 10.9970,
    lng: 76.9600,
    cargo: "Commercial Hardware & Fasteners",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "25 mins",
  },
  {
    id: "del-07",
    code: "DEL-POL-07",
    customerName: "Annamalai Agro Processing Hub",
    customerPhone: "+910000000000",
    address: "Palakkad Road Industrial Zone, Pollachi",
    lat: 10.6580,
    lng: 77.0080,
    cargo: "Industrial Electronics & Sensor Modules",
    priority: "normal",
    status: "open",
    assignedTo: null,
    etaText: "55 mins",
  },
  {
    id: "del-08",
    code: "DEL-MED-MTP-08",
    customerName: "Mettupalayam Government Hospital",
    customerPhone: "+910000000000",
    address: "Ooty Main Road, Mettupalayam, Nilgiris Foothills",
    lat: 11.2990,
    lng: 76.9420,
    cargo: "Liquid Medical Oxygen Cylinders",
    priority: "medical",
    status: "open",
    assignedTo: null,
    etaText: "48 mins",
  },
];

// Initial Seed Hazards (3 specified hazards)
const INITIAL_HAZARDS = [
  {
    id: "haz-landslide-01",
    type: "landslide",
    lat: 11.3170,
    lng: 76.9070,
    radiusM: 1500,
    severity: "critical",
    note: "Landslide-risk zone on the Mettupalayam–Kallar ghat road",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "haz-roadblock-02",
    type: "roadblock",
    lat: 10.9925,
    lng: 76.9610,
    radiusM: 300,
    severity: "high",
    note: "Roadblock near Ukkadam bypass due to pipeline maintenance",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "haz-rain-03",
    type: "rain",
    lat: 11.0180,
    lng: 76.9750,
    radiusM: 400,
    severity: "medium",
    note: "Waterlogging and heavy rain near the Avinashi Road flyover",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// In-memory store state
class MockStore {
  constructor() {
    this.deliveries = JSON.parse(JSON.stringify(INITIAL_DELIVERIES));
    this.hazards = JSON.parse(JSON.stringify(INITIAL_HAZARDS));
    this.liveLocations = new Map();
    this.messages = [];
  }

  getDeliveries() {
    return JSON.parse(JSON.stringify(this.deliveries));
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
      role: profile?.role || "driver",
      priority: profile?.priority || "normal",
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      heading: Number(loc.heading) || 0,
      status: loc.status || "active",
      destination: loc.destination || null,
      updatedAt: Date.now(),
    });
    return true;
  }

  getLiveLocations() {
    return Array.from(this.liveLocations.values());
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
    return this.messages.filter((m) => m.fromUid === uid || m.toUid === uid || toUid === "admin" || toUid === "all");
  }
}

// Singleton in-memory store
export const mockStore = new MockStore();
