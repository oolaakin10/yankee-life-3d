# YANKEE LIFE — Two-player multiplayer MVP

This package adds a two-player WebSocket presence server to the free browser prototype.

## Run locally
1. Install Node.js 18 or newer.
2. Extract this folder.
3. In a terminal, run:
   ```bash
   npm install
   npm start
   ```
4. Open `index.html` in two browser windows on the same computer.
5. In both windows, set server URL to `ws://localhost:3001`, use the same room code (for example `TIMESQUARE`), and click **Connect**.
6. Move with WASD / arrow keys. The other avatar should appear and move in the same city view.

## Connect from different devices and locations
A public server is required. `localhost` only points to the current device.

1. Deploy this folder's Node.js service to a public Node hosting service or VPS.
2. Set its start command to `npm start`; the service reads the `PORT` environment variable.
3. Enable HTTPS/TLS at the host or reverse proxy so the WebSocket URL is `wss://...`.
4. Open the game on each device. Enter the same public `wss://` URL and room code on both, then click **Connect**.
5. Use a distinct room code if you want a private-feeling room; this prototype does not implement passwords or private room authentication.

## What's included
- Room codes and a two-player room limit
- WebSocket connection state
- Live remote avatar position/name updates
- Disconnect notifications
- Server-side coordinate clamping and basic movement rate limiting
- `/health` endpoint for hosting health checks
- No payment or checkout functionality

## Limitations / security
This is an early networking prototype, not a secure production multiplayer backend. Anyone who knows a room code may join it. The server relays player positions but does not yet run authoritative movement, accounts, moderation, chat, or cloud persistence. Do not treat client-reported positions, profile details, coins, or progress as trusted. Before public launch, add authentication, private-room controls, abuse protection, secure hosting, observability, and server-authoritative gameplay state.

The game is still a 2D canvas city prototype, not a finished 3D world. No payment features are included.
