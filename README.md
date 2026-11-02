# FarmTrack (frontend)

React + Vite farm parcel mapper. Talks to the **FarmTrack FastAPI** backend (JWT in HTTP-only cookies).

## Setup

```bash
cp .env.example .env
# Set VITE_GOOGLE_MAPS_API_KEY and VITE_API_URL (default http://localhost:8000)

npm install
npm run dev
```

Backend must be running (see Farm_track_app_Backend `docker compose up --build`).

## Auth

- Register: email, phone, password (min 8 chars), optional full name
- Session: HTTP-only cookies (`ft_access` / `ft_refresh`) via `credentials: 'include'`

## Backend repo

https://github.com/mburumanasseh/Farm_track_app_Backend
