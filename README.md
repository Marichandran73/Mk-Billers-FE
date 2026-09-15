# Mk-Billers-FE

React + Vite frontend for MK Billers.

## Local Run

1. Install dependencies:

   npm install

2. Copy `.env.example` to `.env`.
3. Set `VITE_API_URL` to your backend API URL.
4. Start dev server:

   npm run dev

## Render Deployment

This folder includes [render.yaml](render.yaml) for static site deployment.

Build and publish settings:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Environment variable:

- `VITE_API_URL=https://your-backend-service.onrender.com/api`

SPA routing is enabled with a rewrite from `/*` to `/index.html`.
