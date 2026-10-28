# YANKEE LIFE — Data Model Plan

This is a target schema plan, not a claim that these tables already exist. PostgreSQL should be introduced when persistent accounts are implemented.

## First persistence milestone

### users
- id (UUID primary key)
- email (unique, normalized; or provider subject)
- auth_provider / auth_subject (unique pair)
- status (pending, active, suspended, deleted)
- created_at, updated_at, deleted_at

### player_profiles
- user_id (PK/FK users)
- display_name
- home_state_code (FK states; virtual selection only)
- home_city_id (nullable FK cities)
- avatar_config (validated JSONB or normalized avatar/item tables)
- level, experience (server-controlled)
- created_at, updated_at

### states / cities / districts
- states: code, name, release_status
- cities: id, state_code, name, release_status
- districts: id, city_id, name, release_status
- Unique constraints prevent duplicate codes/names within parents.
- Unreleased locations are marked coming_soon and cannot be joined as playable worlds.

### game_sessions / world_rooms
- sessions: id, user_id, room_id, connected_at, disconnected_at, client_version
- rooms: id, world_id, capacity, status, created_at
- Store only operationally necessary data and expire old session telemetry.

### wallet_accounts / wallet_transactions
- wallet_accounts: user_id (PK/FK), balance (integer, non-negative), updated_at
- wallet_transactions: id, user_id, idempotency_key, type, amount, balance_after, reason_code, metadata, created_at
- Unique(user_id, idempotency_key); transaction rows append-only.
- Every wallet mutation runs in a database transaction with balance validation and an audit trail.
- Yankee Coins remain nonredeemable virtual currency; no cash-out in the initial release.

### careers / job_assignments
- careers: id, name, enabled, config
- job_assignments: id, user_id, career_id, status, started_at, completed_at, reward_transaction_id
- Server verifies prerequisites, duration/cooldowns and completion before posting rewards.

### inventory_items / player_inventory
- inventory_items: id, catalog_key, display_name, category, metadata, enabled
- player_inventory: user_id, item_id, quantity, acquired_at
- Add uniqueness and quantity constraints based on item semantics.

### properties / leases / furniture_placements (later)
- properties: id, world_location_id, property_type, status, price, rent_price
- leases: id, property_id, tenant_user_id, starts_at, ends_at, status
- furniture_placements: id, property_id, item_id, position, rotation, placed_by, created_at
- Ownership/lease transitions require server validation and transactional updates.

### moderation (before public beta)
- player_reports: id, reporter_id, reported_user_id, category, status, created_at
- user_blocks: blocker_id, blocked_id, created_at; composite primary key
- moderation_actions: id, moderator_id, target_user_id, action, reason, created_at
- admin_audit_log: id, actor_id, action, target_type, target_id, metadata, created_at

## Database constraints and indexes
- Foreign keys for ownership and references.
- Index sessions by room_id and active status.
- Index job assignments by user_id/status.
- Index transactions by user_id/created_at.
- Unique idempotency keys per user.
- Check constraints for non-negative balances and valid statuses.
- Parameterized queries only; least-privilege database role.
- Migrations are version-controlled and tested before production deployment.

## Deferred tables
Advertising campaigns, payment records, verification-provider statuses, business inventory/sales and multi-region routing should be added only when their product phases are approved. No raw identity documents or biometric data should be stored in the game database by default.
