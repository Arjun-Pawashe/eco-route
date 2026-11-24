# EcoRoute

Smarter Routes. Greener Future — powered by **Google Maps Platform**.

## Architecture

- **Frontend (`client/`)**: React + Vite with Google Maps-style top-bar navigation, interactive **Maps JavaScript API** (`TrafficLayer` + clickable multi-route polylines), and **Firebase Authentication**.
- **Backend (`server/`)**: Express server handling **Google Places API (New)**, **Google Routes API v2** (`TRAFFIC_AWARE`, `computeAlternativeRoutes`), and **MongoDB** persistence, secured with Firebase ID token verification.

See `GOOGLE_MAPS_SETUP.md` for step-by-step Google Maps API configuration instructions.
