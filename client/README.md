# EcoRoute Client

React + Vite frontend hosted on **Firebase Hosting**, using **Firebase Authentication** for user login/registration and sending Firebase ID tokens to the Render backend (`server/`) for Mappls APIs and MongoDB persistence.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase Web App config and `VITE_API_URL` (pointing to your Render server).
2. Run `npm install`.
3. Run `npm run dev` for local development, or `npm run build` followed by `firebase deploy --only hosting` to deploy.
