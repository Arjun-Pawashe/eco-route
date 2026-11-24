# Google Maps API Setup Guide for EcoRoute

Follow these steps to configure Google Maps Platform for both the frontend (`client/`) and backend (`server/`).

## 1. Create a Google Cloud Project & Enable Billing

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** -> **New Project**, name it (e.g., `EcoRoute`), and click **Create**.
3. Open **Billing** in the left navigation menu and link a billing account to your project (Google Maps Platform provides a monthly recurring free credit tier, but requires an active billing account).

## 2. Enable the Required APIs

In **APIs & Services -> Library**, search for and enable these three APIs:

1. **Maps JavaScript API** — Renders the interactive Google Map and live Traffic Layer in `client/`.
2. **Routes API** — Computes multiple alternative routes with real-time `TRAFFIC_AWARE` durations and `staticDuration` in `server/`.
3. **Places API (New)** — Powers origin and destination text search (`places:searchText`) in `server/`.

## 3. Create & Restrict Your API Keys

Go to **APIs & Services -> Credentials -> Create Credentials -> API Key**. Create two keys for security:

### A. Frontend Key (`VITE_GOOGLE_MAPS_API_KEY`)
- **Application restrictions**: **Websites (HTTP referrers)**
  - Add `http://localhost:5173/*` for local development
  - Add your production domain (e.g., `https://your-app.web.app/*`)
- **API restrictions**: Restrict key to **Maps JavaScript API**

### B. Backend Key (`GOOGLE_MAPS_API_KEY`)
- **Application restrictions**: **IP addresses** (for your server/Render outbound IPs, or leave unrestricted during local dev)
- **API restrictions**: Restrict key to **Routes API** and **Places API (New)**

## 4. Configure Environment Variables

### `server/.env`
Copy `server/.env.example` to `server/.env` and set:
```env
GOOGLE_MAPS_API_KEY=your_backend_api_key_here
```

### `client/.env`
Copy `client/.env.example` to `client/.env` and set:
```env
VITE_GOOGLE_MAPS_API_KEY=your_frontend_api_key_here
```

## 5. Run Locally

```bash
# Terminal 1: Backend
cd server
npm install
npm run dev

# Terminal 2: Frontend
cd client
npm install
npm run dev
```
