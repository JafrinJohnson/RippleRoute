# RippleRoute — Project Context & Architectural Blueprint

## 1. Product Overview
- **Product Name**: RippleRoute
- **Definition**: Disruption-aware logistics control web application for **KovaiSwift Logistics** (a premier fictional logistics enterprise operating across Coimbatore and the Nilgiris/Western Ghats region).
- **Core Mission**: Continuously answer three critical operational questions in real time:
  1. **What changed?** (Hazards, roadblocks, weather anomalies, vehicle breakdowns, sudden landslides).
  2. **What is affected?** (Active shipments, delivery commitments, drivers, perishable and medical cargo, downstream customers).
  3. **What should we do next?** (Autonomous quantum-inspired re-routing, driver reassignment, prioritized rescue routing, automated customer delay advisories).

## 2. User Roles & Personas
- **Admin (Logistics + Delivery + Operations Management Teams)**:
  - Live spatial telemetry of all drivers across Coimbatore and arterial corridors.
  - Interactive hazard marking (roadblocks, accidents, landslides, flash floods).
  - Two-way dispatcher-to-driver secure comms (messaging, advisory dispatch).
  - One-click swarm re-optimization & dispatch re-balancing.
  - Automated customer SMS broadcast dispatch with transparent reason and assured updated ETA.
- **Driver**:
  - Distraction-free driver cockpit with turn-by-turn guidance.
  - Views 2–3 candidate routes under normal conditions.
  - One-tap **"Optimize with QARS"** button to trigger instant route synthesis and display minutes saved and fuel efficiency gains.
  - Rapid hazard reporting and panic/assistance requests.
- **Emergency**:
  - Dedicated rapid-response profile for high-value and short-lifespan cargo:
    - **Medical**: Liquid medical oxygen, blood units, antivenom, critical organ transfers.
    - **Perishables**: Ultra-fresh agricultural produce, temperature-sensitive vaccines/dairy.
  - Guaranteed highest dynamic routing priority across all nodes.
- **Customer (No Login Required)**:
  - Frictionless notification paradigm: direct SMS with delay causation and mathematically assured dynamic ETA.

## 3. Algorithmic Routing Engine
- **Engine**: **QARS** (Quantum-inspired Adaptive Route Swarm).
- **Methodology**: Quantum Particle Swarm Optimization (QPSO) modeling dynamic fitness landscapes across Coimbatore’s traffic density and ghat road terrains.
- **Driver UX**: Shows initial route alternatives, then clicking **"Optimize with QARS"** collapses the wave function into the single mathematically optimal route with quantified delta (time saved, carbon saved).

## 4. Regional Hazards & Topography
- **Territory**: Coimbatore metropolitan core + Western Ghats arterial passes.
- **Hazard Classes**:
  - `accident`: Vehicle collision / clearance operations.
  - `roadblock`: Civic work, VIP movement, protests, fallen trees.
  - `breakdown`: Fleet vehicle mechanical or electrical failure.
  - `rain`: Torrential seasonal monsoons and waterlogging (e.g., Avinashi road underpasses).
  - `landslide`: High-risk ghat sections (e.g., Mettupalayam – Kallar – Coonoor hairpins).
- **Advisory Engine**: Bilingual real-time contextual advisories delivered natively in **English** and **Tamil (தமிழ்)**.

## 5. Geospatial & Mapping Specifications
- **Map Library**: Leaflet (via React Leaflet, dynamically imported with `ssr: false`).
- **Tile Providers**:
  - **Satellite**: Esri World Imagery + Reference Labels.
  - **Terrain**: OpenTopoMap (vital for elevation contours in ghat passes).
  - **Dark**: CARTO Dark Matter (optimal for night-mode mission control).
- **Coordinates of Reference**:
  - **Coimbatore City Center**: `[11.0168, 76.9558]`
  - **Primary Logistics Depot (Peelamedu Hub)**: `[11.0270, 77.0100]`

## 6. Frontend-First Architectural Rules
- **Rule 1 (Single Data Gateway)**: All application data access and mutations MUST strictly route through `src/services/api.js` and `src/context/AuthContext.js`.
- **Rule 2 (Mock Interchangeability)**: Data services currently return deterministic high-fidelity mock data. Subsequent development phases will swap internal implementations to Firebase and live REST/WebSocket backends without modifying function signatures, parameters, or return shapes.
- **Rule 3 (Zero Direct Mock Imports)**: UI components must NEVER import mock data directly; only call through `src/services/api.js`.
- **Rule 4 (SSR & Window Safety)**: Leaflet, Three.js, and client-only browser APIs must load with `next/dynamic` and `{ ssr: false }`. Never access `window`, `localStorage`, or `navigator` at module top-level. Wrap all browser storage calls in defensive `try/catch`.
- **Rule 5 (Resilient Async)**: Every asynchronous request must implement defensive `try/catch` with deterministic graceful fallback data.
- **Rule 6 (Zero External Images)**: Never load volatile external image URLs. Use inline SVG vector graphics, CSS gradients, Canvas, or generated assets.
- **Rule 7 (Continuous Verification)**: Run `npm run build` after major structural additions to maintain zero TypeScript/ESLint/Webpack regressions.
- **ROAD RULE**: Every route line in the app comes from `getRoadRoutes` (real road geometry, `overview=full`) and every moving vehicle moves only along its route with `routeAnimator`. Never draw or animate straight lines between start and end.
