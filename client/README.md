# EcoRoute Client

React + Vite frontend using **Google Maps JavaScript API** (interactive map, live traffic layer, and multi-route polylines) and **Firebase Authentication**, communicating with the Express backend (`server/`) for Places/Routes APIs and MongoDB persistence.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase Web App config, `VITE_GOOGLE_MAPS_API_KEY`, and `VITE_API_URL`.
2. Run `npm install`.
3. Run `npm run dev` for local development, or `npm run build` followed by `firebase deploy --only hosting` to deploy.
