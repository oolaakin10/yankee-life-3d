# YANKEE LIFE — MVP Architecture

**Product:** YANKEE LIFE — Live Your American Story  
**Current release:** Browser-playable 3D life-simulation prototype set in an original Manhattan-inspired starter district.  
**Principle:** Ship a small, honest, tested vertical slice before expanding nationally.

## Current implementation
- Browser client: HTML/CSS/JavaScript with Three.js loaded from jsDelivr.
- World: procedurally assembled stylized city, third-person camera, keyboard and touch movement, interactive destinations.
- Life loop: local prototype wallet and energy, work/rest/café actions.
- Multiplayer: Node.js HTTP server with a WebSocket room relay, two-player room limit, position updates and disconnect handling.
- Hosting: GitHub source and Render Node web service with a health endpoint.
- Entry cost: free; no checkout or payment flow.

**Important limitation:** coins, energy and shifts are stored in browser localStorage and can be edited by players. The WebSocket relay is unauthenticated and client-reported positions are not authoritative. This is a prototype, not a production-ready economy or verified-user platform.

## Target MVP architecture
Browser client (responsive UI + Three.js)
- HTTPS: game client
- WSS: real-time session
- Node.js API / multiplayer gateway
  - room membership, message validation and rate limits
  - later: authenticated sessions and authoritative world state
- PostgreSQL (planned, not yet connected)
  - users, profiles and avatar configuration
  - world locations, jobs and item catalog
  - wallets, immutable ledger, inventory and properties
  - moderation and audit events
- Object storage + CDN later for licensed 3D assets and audio
- Monitoring, error tracking and backups before public beta

## Recommended stack
- **Client:** keep Three.js for the first vertical slice; introduce TypeScript and a build tool when code is split into modules.
- **Realtime:** Node.js + ws for the prototype. Evaluate Colyseus when room state, matchmaking, reconnection and authoritative simulation justify it.
- **Persistence:** managed PostgreSQL for account and gameplay records. Never use localStorage as source of truth for coins, ownership, payments or progression.
- **Authentication:** established provider or secure server-side sessions; enforce authorization on every protected action.
- **Identity / age / residency:** separate later integrations with privacy and legal review. Do not collect IDs in the game server or treat a selected home state as verified residency.
- **Operations:** Render for the current service; add structured logs, error monitoring, backups, staging and CI before beta.

## Core service boundaries
1. **Game client** renders the world and sends player intent. It is not trusted for currency or ownership.
2. **Session service** validates sessions and room membership.
3. **World simulation** owns authoritative position, collision, job eligibility and reward decisions.
4. **Economy service** posts balanced, idempotent ledger transactions. Wallet changes are transactional.
5. **Profile service** stores avatar, display name and selected virtual home state.
6. **Moderation service** supports report, block, mute, suspension and audit trails.
7. **Admin service** requires role-based access control and logs sensitive actions.

## Data and security rules
- Use TLS in hosted environments.
- Validate message type, schema, numeric ranges and payload size on the server.
- Apply connection, message and action rate limits.
- Treat names, room codes and chat as untrusted input; render text safely.
- Use parameterized database queries and least-privilege credentials.
- Store secrets only in Render environment settings, never in browser code or repository.
- Use append-only economy transaction records, idempotency keys and database transactions.
- Keep identity-provider reference/status only where possible; avoid storing raw ID images or biometrics.
- Add retention, account deletion, appeals, privacy notices and incident response before eligibility checks go live.

## Initial service-level goals (targets, not measured results)
- Health endpoint returns HTTP 200 while the process is ready.
- Malformed WebSocket messages do not crash the process.
- Room cap and per-connection message limits are enforced.
- Mobile viewport supports movement and interaction without horizontal overflow.
- Reconnection restores saved progress only after authentication and persistence exist.
- Track frame rate, load time, reconnects, errors and server memory in a later instrumented test pass.

## Architecture decisions
- One city first; all 50 states remain future catalog/navigation records, not falsely presented as playable worlds.
- Keep the initial game free and omit checkout. Monetization is a separate later product/legal decision.
- Prototype rewards remain local-only until server-authoritative jobs and persistence ship.
- Use original or properly licensed assets; do not copy proprietary maps, art or characters.
