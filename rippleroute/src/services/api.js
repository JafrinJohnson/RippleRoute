/**
 * RippleRoute — Core API Service Gateway
 * 
 * FRONTEND-FIRST RULE:
 * All application data access and mutations MUST strictly route through this module.
 * It provides mock data with simulated asynchronous latency and error handling.
 * In subsequent development phases, this file will interface with Firebase and backend endpoints
 * WITHOUT changing any function names, arguments, or return data structures.
 */

// Central reference coordinates for KovaiSwift Logistics
export const DEPOT_PEELAMEDU = { lat: 11.0270, lng: 77.0100, name: "Peelamedu Central Depot" };
export const COIMBATORE_CENTER = { lat: 11.0168, lng: 76.9558, name: "Coimbatore City Center" };

// Deterministic mock datasets
const MOCK_DRIVERS = [
  {
    id: "drv-01",
    name: "Karthik Raja",
    phone: "+91 98421 23011",
    role: "driver",
    status: "active",
    vehicle: "TN-37-BY-4512 (EV Van)",
    currentLocation: { lat: 11.0180, lng: 76.9620 },
    assignedRouteId: "route-01",
    cargoType: "Standard Freight",
    destination: "Gandhipuram Hub",
    etaMinutes: 14,
    batteryPercent: 82,
  },
  {
    id: "drv-02",
    name: "Praveen Kumar",
    phone: "+91 98421 88402",
    role: "emergency",
    status: "disrupted",
    vehicle: "TN-38-AL-9014 (Refrigerated Med)",
    currentLocation: { lat: 11.1012, lng: 76.9421 },
    assignedRouteId: "route-02",
    cargoType: "Medical Oxygen & Vaccines",
    destination: "Mettupalayam GH",
    etaMinutes: 38,
    isEmergency: true,
    lifespanRemainingHours: 3.5,
  },
  {
    id: "drv-03",
    name: "Senthil Nathan",
    phone: "+91 94433 11209",
    role: "driver",
    status: "active",
    vehicle: "TN-37-CW-3321 (Heavy Hauler)",
    currentLocation: { lat: 10.9980, lng: 77.0340 },
    assignedRouteId: "route-03",
    cargoType: "Agricultural Perishables",
    destination: "Singanallur Terminal",
    etaMinutes: 22,
    batteryPercent: 64,
  },
  {
    id: "drv-04",
    name: "Ananya Subramanian",
    phone: "+91 97890 55641",
    role: "emergency",
    status: "rerouted",
    vehicle: "TN-38-K-1100 (Rapid Transit)",
    currentLocation: { lat: 11.0420, lng: 76.9950 },
    assignedRouteId: "route-04",
    cargoType: "Critical Organ Transplant Transit",
    destination: "KMCH Avinashi Road",
    etaMinutes: 9,
    isEmergency: true,
    lifespanRemainingHours: 1.2,
  },
];

const MOCK_HAZARDS = [
  {
    id: "haz-101",
    type: "landslide",
    severity: "critical",
    location: { lat: 11.2340, lng: 76.9150 },
    roadName: "Mettupalayam–Kallar Ghat Road (KM 14)",
    reportedAt: "10 mins ago",
    advisoryEn: "Active rockfall and debris on hairpins 3 & 4. Ghat pass closed for heavy traffic.",
    advisoryTa: "கொண்டை ஊசி வளைவு 3 & 4ல் பாறை மற்றும் மண் சரிவு. கனரக வாகன போக்குவரத்து நிறுத்தம்.",
    affectedRoutes: ["route-02"],
    clearedStatus: false,
  },
  {
    id: "haz-102",
    type: "accident",
    severity: "high",
    location: { lat: 11.0250, lng: 76.9800 },
    roadName: "Avinashi Road Flyover near Lakshmi Mills",
    reportedAt: "25 mins ago",
    advisoryEn: "Multi-vehicle pileup on west-bound lane. Moderate delay of 18 minutes expected.",
    advisoryTa: "லட்சுமி மில்ஸ் அருகே மேற்கு வழித்தடத்தில் விபத்து. 18 நிமிடம் தாமதம் எதிர்பார்க்கப்படுகிறது.",
    affectedRoutes: ["route-01", "route-04"],
    clearedStatus: false,
  },
  {
    id: "haz-103",
    type: "rain",
    severity: "medium",
    location: { lat: 10.9850, lng: 76.9600 },
    roadName: "Lanka Corner Railway Underpass",
    reportedAt: "40 mins ago",
    advisoryEn: "Heavy waterlogging under railway bridge. Light commercial vehicles diverted via Town Hall.",
    advisoryTa: "ரயில்வே மேம்பாலத்தின் கீழ் கடுமையான நீர் தேக்கம். வாகனங்கள் டவுன்ஹால் வழியாக திருப்பிவிடப்படுகின்றன.",
    affectedRoutes: ["route-03"],
    clearedStatus: false,
  },
];

const MOCK_ROUTES = [
  {
    id: "route-01",
    driverId: "drv-01",
    name: "Peelamedu to Gandhipuram Express",
    status: "optimal",
    waypoints: [
      [11.0270, 77.0100],
      [11.0210, 76.9950],
      [11.0180, 76.9620],
      [11.0168, 76.9558],
    ],
    distanceKm: 8.4,
    currentDurationMin: 22,
    optimizedDurationMin: 15,
    qarsOptimized: false,
  },
  {
    id: "route-02",
    driverId: "drv-02",
    name: "Peelamedu to Mettupalayam Ghat Lifeline",
    status: "disrupted",
    waypoints: [
      [11.0270, 77.0100],
      [11.0800, 76.9800],
      [11.1900, 76.9300],
      [11.2340, 76.9150],
      [11.3000, 76.9400],
    ],
    distanceKm: 38.6,
    currentDurationMin: 68,
    optimizedDurationMin: 44,
    qarsOptimized: false,
  },
];

// Helpers
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all active driver telemetries
 */
export async function getDrivers() {
  try {
    await delay(120);
    return { success: true, data: [...MOCK_DRIVERS] };
  } catch (error) {
    console.error("API Error getDrivers:", error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Fetch a single driver by ID
 */
export async function getDriverById(id) {
  try {
    await delay(100);
    const driver = MOCK_DRIVERS.find((d) => d.id === id);
    if (!driver) return { success: false, error: "Driver not found" };
    return { success: true, data: driver };
  } catch (error) {
    console.error("API Error getDriverById:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all active hazards and weather advisories
 */
export async function getHazards() {
  try {
    await delay(150);
    return { success: true, data: [...MOCK_HAZARDS] };
  } catch (error) {
    console.error("API Error getHazards:", error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Add a newly marked hazard (Admin action)
 */
export async function reportHazard(hazardData) {
  try {
    await delay(200);
    const newHazard = {
      id: `haz-${Date.now()}`,
      severity: "high",
      reportedAt: "Just now",
      clearedStatus: false,
      affectedRoutes: [],
      ...hazardData,
    };
    MOCK_HAZARDS.unshift(newHazard);
    return { success: true, data: newHazard };
  } catch (error) {
    console.error("API Error reportHazard:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger QARS (Quantum-inspired Adaptive Route Swarm) optimization
 * Collapses multi-route swarm into the single best optimal path.
 */
export async function optimizeRouteWithQARS(routeId) {
  try {
    await delay(600); // Simulate quantum-inspired swarm convergence computation
    const route = MOCK_ROUTES.find((r) => r.id === routeId) || MOCK_ROUTES[0];
    const timeSavedMin = Math.max(4, Math.round((route.currentDurationMin - route.optimizedDurationMin) * 1.1));
    const distanceDiffKm = (route.distanceKm * 0.94).toFixed(1);
    
    return {
      success: true,
      data: {
        routeId: route.id,
        originalTimeMin: route.currentDurationMin,
        optimizedTimeMin: route.optimizedDurationMin,
        timeSavedMin,
        distanceKm: distanceDiffKm,
        fuelSavingsPercent: 18.4,
        confidenceScore: 0.982,
        swarmParticlesConverged: 128,
        advisory: "QARS collapsed wave function: Route bypasses Kallar hairpins via Karamadai corridor.",
      },
    };
  } catch (error) {
    console.error("API Error optimizeRouteWithQARS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Dispatch customer SMS update with transparent delay reason and assured ETA
 */
export async function sendCustomerSMS(notificationPayload) {
  try {
    await delay(250);
    return {
      success: true,
      data: {
        messageId: `sms-${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipient: notificationPayload.recipient || "+91 99940 *****",
        status: "delivered",
        content: notificationPayload.message || "KovaiSwift: Your delivery has been rerouted due to localized hazard. Updated assured ETA: 18 mins.",
      },
    };
  } catch (error) {
    console.error("API Error sendCustomerSMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get overall system metrics for mission-control stat cards
 */
export async function getSystemMetrics() {
  try {
    await delay(120);
    return {
      success: true,
      data: {
        activeDrivers: 24,
        onTimeRate: 96.4,
        activeHazards: 3,
        emergencyPriorityLoads: 5,
        totalTimeSavedTodayMin: 342,
        fuelConservedLitres: 78.5,
      },
    };
  } catch (error) {
    console.error("API Error getSystemMetrics:", error);
    return {
      success: false,
      data: {
        activeDrivers: 24,
        onTimeRate: 96.4,
        activeHazards: 3,
        emergencyPriorityLoads: 5,
        totalTimeSavedTodayMin: 342,
        fuelConservedLitres: 78.5,
      },
    };
  }
}
