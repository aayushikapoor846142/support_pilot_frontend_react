# SupportPilot Frontend

A React + Vite frontend for the SupportPilot workspace management app.

## Getting started

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env.local` and set `VITE_API_URL` to your backend API base URL (including its API prefix, if applicable).
3. Start the app:
   npm run dev
4. Open the app in a browser:
   http://localhost:4173

## Scripts

- npm run dev — starts the Vite dev server on port 4173
- npm run build — creates a production build
- npm run lint — runs ESLint
- npm run preview — serves the production build locally on port 4173

The app requires `VITE_API_URL` for all authentication and data requests; it does not fall back to a default backend URL. Restart the dev server after changing environment variables.