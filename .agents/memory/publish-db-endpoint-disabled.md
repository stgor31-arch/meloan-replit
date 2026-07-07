---
name: Publish fails with "database diff / endpoint disabled" or "production database is frozen"
description: Diagnosis + fix when a Replit publish/build fails on the DB schema-diff step.
---

# Publish fails on the DB schema-diff step

**Symptom:** Publish/deploy fails during Building with
`Failed to check for database diff: The endpoint has been disabled. Enable it using the API and retry.`
`npm run build` succeeds locally and the live site may still be up.

**Two distinct causes — check BOTH:**

1. **Dev provisioning link dropped.** `checkDatabase()` returns `provisioned: false`
   even though a direct dev `executeSql("SELECT 1")` works and data is intact.
   Fix: `createDatabase()` (idempotent; returns `alreadyExisted: true`, re-links,
   flips `provisioned` to true). Non-destructive.

2. **Production database is FROZEN** (the real blocker in practice). Confirm with
   `executeSql({ environment: "production", sqlQuery: "SELECT 1" })` — a frozen prod
   DB returns `PRODUCTION_DATABASE_ERROR ... The production database for repl <id> is
   frozen. Unfreeze it first.` The publish schema-diff introspects BOTH dev and prod;
   a frozen prod DB makes it fail with the misleading "endpoint disabled" message.
   **The agent CANNOT unfreeze it** (prod access is read-only and blocked while frozen).
   The USER must unfreeze it in the Replit UI: Database tool → Production tab →
   Unfreeze / Resume, then re-click Publish. Prod DBs freeze after deployment
   inactivity (or plan reasons).

**Why:** publish flow diffs dev+prod schemas; either a broken dev link OR a frozen
prod DB aborts the diff before any code issue.

**How to apply:** (a) snapshot dev table counts, run `createDatabase()`, confirm
`provisioned: true`; (b) if publish still fails, probe prod with a read query — if
"frozen", it's a user action in the UI, not something to fix in code. Never run DDL
against prod or write migration scripts.
