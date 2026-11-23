# EcoRoute Server (Render)

Express backend for **Mappls (MapmyIndia)** APIs and **MongoDB** persistence, with authentication handled by **Firebase Auth** on the frontend and verified on the backend via Firebase ID tokens (`firebase-admin`).

## Endpoints

- `GET /api/health` — Health check
- `GET /api/mappls/token`, `GET /api/mappls/search`, `POST /api/mappls/routes` — Mappls proxy
- `GET/POST /api/users/profile`, `PUT /api/users/preferences`, `PUT /api/users/saved-places` — User profile & preferences (Firebase Bearer token required)
- `GET/POST /api/journeys`, `DELETE /api/journeys/:id` — Journey history (Firebase Bearer token required)
- `GET /api/dashboard/stats` — Dashboard metrics, charts, and green streak (Firebase Bearer token required)

## Environment Variables

Copy `.env.example` to `.env` and set `MONGODB_URI`, Mappls credentials, `CLIENT_URL`, and Firebase Admin service account credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
