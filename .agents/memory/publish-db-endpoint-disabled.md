---
name: Publish fails with "database diff / endpoint has been disabled"
description: Diagnosis + fix when a Replit publish/build fails on the DB schema-diff step.
---

# Publish fails: "Failed to check for database diff: The endpoint has been disabled"

**Symptom:** Publish/deploy fails during the Building step with
`Failed to check for database diff: The endpoint has been disabled. Enable it using the API and retry.`
Meanwhile `npm run build` succeeds locally and the live site may still be up.

**Root cause:** The managed Postgres provisioning link dropped / compute endpoint
disabled. Tell-tale sign: `checkDatabase()` returns `provisioned: false` EVEN THOUGH
a direct `executeSql("SELECT 1")` against dev still works and data is intact. The
publish-time schema diff can't reach the DB, so the build aborts.

**Fix (idempotent, non-destructive):** call `createDatabase()`. If a managed DB
already exists it returns `alreadyExisted: true`, re-links provisioning, and
`checkDatabase()` flips to `provisioned: true`. Data is untouched.

**Why:** the publish flow introspects dev+prod DBs to compute a SQL diff; a broken
provisioning link makes that step fail before any code issue.

**How to apply:** snapshot key table counts first (safety check), run
`createDatabase()`, confirm `provisioned: true` and counts unchanged, then have the
user re-click Publish. Do NOT run DDL against prod or write migration scripts —
schema promotion is handled automatically by the Publish diff.
