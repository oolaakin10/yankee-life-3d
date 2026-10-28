# YANKEE LIFE — Live Your American Story

A free browser-based 3D life-simulation prototype set in an original, Manhattan-inspired starter district. Explore the city, move with keyboard or touch controls, work for local prototype coins, rest, visit a café, and connect with one friend using a room code.

**Play:** https://yankee-life-live.onrender.com  
**Source:** https://github.com/oolaakin10/yankee-life-3d

## Current features
- Three.js 3D city scene and third-person camera.
- WASD / arrow movement, drag-to-look camera and mobile D-pad.
- Nearby destinations and contextual interactions.
- Prototype life loop: work (+35 coins, -12 energy), rest (+30 energy), café snack (-10 coins, +20 energy).
- Local browser save for prototype coins, energy and shift count.
- WebSocket presence relay for up to two players per room.
- Health check at /health; Render deploys from main.

## Run locally
Requires Node.js 18+.
```bash
npm install
npm start
```
Open http://localhost:3001. For two local players, open two browser windows and connect both to ws://localhost:3001 using the same room code. If opening the HTML directly as a file, browser module restrictions may prevent Three.js from loading; use the local server instead.

## Deployment
Render uses render.yaml, npm install, npm start and health check /health. Set no secrets for the current prototype. GitHub pushes to main trigger deployment automatically.

## Architecture and roadmap
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap, budget and first sprint](docs/ROADMAP.md)
- [Database plan](docs/DATABASE.md)

## Honest limitations
This is an early prototype, not a finished AAA game or production-ready social platform. Multiplayer is an unauthenticated two-player position relay. Player coins and energy are stored in localStorage and are not tamper-proof or synced between devices. There is no persistent account system, authoritative economy, chat, housing ownership, business system, identity verification, residency verification, admin dashboard, payment processing or checkout. Unbuilt cities/states are not playable yet.

The initial release intentionally has **no payments or checkout**. Keep Yankee Coins nonredeemable. Add authentication, server-authoritative actions, database persistence, moderation, privacy/security review and automated acceptance tests before a public beta.

Use original or properly licensed assets; do not copy protected game assets or maps.
