# API Monitor (basic)

A minimal, working full-stack API monitoring app:

## 🚀 Live Demo

Frontend: https://effulgent-kleicha-4c7698.netlify.app/

- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT auth + a real `node-cron` job that
  sends actual HTTP requests to each API you add and records the result.
- **Frontend**: a single static `index.html` (no build step) that talks to the backend over REST
  and polls for updated status every 10 seconds.

Scope is intentionally basic: register/login, add/pause/resume/delete APIs, and see live
health/response time. No teams, notifications, incidents analytics, or Socket.IO — see the chat
for what was cut and why.

**Added on top of the basic version:**
- Dashboard summary (total / healthy / down, current uptime %, average response time, a response-time bar chart)
- Dark/light theme toggle (persisted in the browser)
- Bulk add — paste multiple `Name, URL` lines at once
- Categories and tags per API, with filter chips and a search bar
- Custom headers per API (so you can monitor endpoints that need an API key/auth token —
  set this under "Advanced" when adding an API, e.g. `{"Authorization": "Bearer xyz"}`)
- Export an API's check history as CSV
- Mobile-responsive layout

Note: "Uptime (current)" on the dashboard is a simple snapshot — the share of currently-monitored
APIs that are healthy or warning right now — not a historical percentage calculated from check
history. A true historical uptime % would need to aggregate the `Check` collection over time,
which isn't built yet.

## Requirements

- Node.js 18+
- A MongoDB instance (local install, or a free MongoDB Atlas cluster)

## 1. Backend setup

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string,
# and set JWT_SECRET to any long random string
npm install
npm run dev
```

The API server starts on `http://localhost:4000`. The monitor cron runs every minute by default
(`CHECK_CRON` in `.env`) and checks each API whose individual `checkIntervalSec` has elapsed.

## 2. Frontend setup

No build step needed — just open the file:

```bash
cd client
open index.html   # or double-click it, or serve it with any static server
```

If your backend isn't on `http://localhost:4000`, update `API_BASE` at the top of the `<script>`
tag in `index.html`.

## 3. Using it

1. Register an account.
2. Add an API by name + URL (try `https://httpstat.us/200` to see a healthy check, or
   `https://httpstat.us/500` to see a down one).
3. Wait for the next cron tick (up to 60s) — status and response time will update automatically.
4. Pause, resume, or delete APIs as needed.

## Project structure

```
server/
  src/
    config/db.js        MongoDB connection
    models/              User, Api, Check schemas
    middleware/auth.js   JWT verification
    routes/auth.js       register / login
    routes/apis.js       CRUD for monitored APIs
    services/monitor.js  the cron job that does real HTTP checks
    index.js             app entry point
client/
  index.html             the entire frontend
```
