# YANKEE LIFE — Roadmap, First Sprint and Cost Model

## Prioritized MVP

### P0 — Current playable foundation
- Responsive game shell and 3D New York-inspired starter district.
- Third-person movement, camera, keyboard and touch controls.
- Work, rest and café loop.
- Two-player room-based presence relay.
- Render health endpoint and automatic deployment from GitHub.
- Clear disclosure that local currency/progress is prototype-only.

### P1 — Next sprint: reliability and playability
- Improve WebSocket input validation, heartbeat and security headers.
- Add automated tests for health route, room capacity, malformed messages and disconnect cleanup.
- Add clear reconnect/error states and mobile usability checks.
- Verify the live Render deploy and browser console.
- Keep no checkout or payment flow.

### P2 — Persistent accounts (before public beta)
- Account sign-in, email verification, account deletion and server-side profiles.
- PostgreSQL schema and migrations.
- Avatar persistence and saved player progress.
- Server-authoritative jobs and wallet ledger.
- Admin roles, moderation, reporting and blocking.
- Privacy and security review.

### P3 — Multiplayer vertical slice
- Authenticated sessions and room authorization.
- Server-owned position, collision and action validation.
- Proximity chat with mute/block/report tools.
- Reconnection handling and room lifecycle metrics.
- Acceptance test: two accounts can meet, move, chat, complete a job, receive a validated reward, log out and return with saved progress.

### P4 — Life simulation expansion
- Starter apartment rentals and persistent furniture.
- More jobs, missions, inventory and skills.
- NPC pedestrians/traffic, improved animation, day/night and audio.
- Performance budgets and device testing.

### P5 — Commercial readiness (not part of the free prototype)
- Legal/privacy review for age, identity and residency verification.
- Optional advertising or premium services only after explicit product approval, security review and payment/refund compliance.
- Do not claim real revenue, ad impressions, verified identity or completed states until implemented and tested.

### P6 — New cities
- Add cities only after New York retention, performance, content pipeline and operations are sustainable.
- Register all 50 states as metadata if useful, but label unbuilt locations Coming Soon.

## First implementation sprint (estimate: 1–2 weeks for a small experienced team)
1. Audit the game and document limitations.
2. Harden the Node/WebSocket service and health route.
3. Add tests for server behavior and input abuse.
4. Verify the live Render deploy and browser console.
5. Fix high-priority regressions and mobile usability issues.
6. Prepare an MVP release and known-issues list.

## Acceptance checklist
- [ ] HTTPS game page loads on desktop and mobile.
- [ ] Three.js assets load and scene renders without console errors.
- [ ] Keyboard and touch movement work.
- [ ] Job/rest/café interactions work.
- [ ] Two clients in the same room see each other and disconnect cleanly.
- [ ] Full room rejects an additional player.
- [ ] Malformed messages cannot crash the process.
- [ ] Health endpoint returns JSON with HTTP 200.
- [ ] UI and docs do not imply production account security or persistent economy.
- [ ] No checkout or payment integration.

## Early-stage cost estimate (USD/month; planning ranges, not vendor quotes)
- **Prototype / demo:** $0–$25. Free hosting can sleep or have resource limits; the current game has no database.
- **Small private alpha with database:** roughly $25–$150, depending on database, app instance, storage, email and monitoring.
- **Public beta with persistent multiplayer:** roughly $150–$1,000+, depending on concurrent users, traffic, database sizing, asset delivery and observability.
- **Identity/residency verification and legal review:** separate usage-based vendor and professional fees; obtain current quotes before choosing providers.
- **Production-scale multi-region world:** cannot be estimated responsibly without concurrent-user targets, traffic profiles, uptime commitments, asset strategy and load tests.

Costs exclude engineering labor, original art/audio, legal counsel and identity-provider fees unless a vendor explicitly includes them.

## Required accounts and secrets
- GitHub repository and Render workspace/service are already configured.
- Later: managed PostgreSQL, email provider, error monitoring, object storage/CDN.
- Much later and only if approved: identity/age/residency provider.
- Payments are intentionally excluded from this initial release.
- Never paste API keys into chat or commit them to Git. Add secrets through Render environment settings.
