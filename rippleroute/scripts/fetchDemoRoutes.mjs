import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEPOT = { lat: 11.0270, lng: 77.0100 }; // Peelamedu Depot

const DELIVERIES = [
  { id: "del-01", lat: 11.0168, lng: 76.9670, name: "Gandhipuram" },
  { id: "del-02", lat: 11.0080, lng: 76.9450, name: "RS Puram" },
  { id: "del-03", lat: 11.0330, lng: 76.9480, name: "Saibaba Colony" },
  { id: "del-04", lat: 10.9980, lng: 77.0260, name: "Singanallur" },
  { id: "del-05", lat: 10.9910, lng: 76.9620, name: "Ukkadam" },
  { id: "del-06", lat: 10.9970, lng: 76.9600, name: "Town Hall" },
  { id: "del-07", lat: 10.6580, lng: 77.0080, name: "Pollachi" },
  { id: "del-08", lat: 11.2990, lng: 76.9420, name: "Mettupalayam" },
];

const OSRM_SERVERS = [
  "https://router.project-osrm.org/route/v1/driving",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving",
];

async function fetchRouteWithFallback(from, to) {
  const coordString = `${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}`;
  
  for (const server of OSRM_SERVERS) {
    const url = `${server}/${coordString}?overview=full&geometries=geojson`;
    try {
      console.log(`Fetching: ${url}`);
      const res = await fetch(url, { headers: { "User-Agent": "RippleRouteDemoFetch/1.0" } });
      if (!res.ok) {
        console.warn(`HTTP ${res.status} from ${server}`);
        continue;
      }
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords = route.geometry.coordinates; // [lng, lat]
        const coords = rawCoords.map(([lng, lat]) => [lat, lng]); // convert to [lat, lng]
        const distanceM = Math.round(route.distance);
        const durationS = Math.round(route.duration);
        return { coords, distanceM, durationS };
      }
    } catch (err) {
      console.warn(`Failed ${server}: ${err.message}`);
    }
  }
  throw new Error(`Failed to fetch route for ${coordString} from all servers`);
}

async function main() {
  const results = {};
  console.log("Fetching demo road routes for 8 deliveries...");

  for (const del of DELIVERIES) {
    console.log(`Fetching route to ${del.id} (${del.name})...`);
    try {
      const routeData = await fetchRouteWithFallback(DEPOT, del);
      results[del.id] = routeData;
      console.log(`✓ ${del.id}: ${routeData.coords.length} points, ${(routeData.distanceM / 1000).toFixed(1)} km`);
    } catch (err) {
      console.error(`✗ Error on ${del.id}:`, err);
    }
    // Polite delay between requests to prevent rate limiting
    await new Promise((r) => setTimeout(r, 600));
  }

  const outDir = path.resolve(__dirname, "../src/data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "demoRoutes.json");
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved demo routes to ${outFile} successfully!`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
