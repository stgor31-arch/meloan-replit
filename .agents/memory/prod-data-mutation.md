---
name: Production data one-off mutations
description: How to safely apply a one-off data change to the production (Helium) database when the agent has read-only prod access.
---

# One-off production data mutations

The agent can only run **read-only** SQL against the production database (`executeSql({environment:"production"})`). There is no direct write path, and the prod `DATABASE_URL` value is not readable. So any one-off prod data change (e.g. merging duplicate user accounts) must go **through the running app**.

## Pattern
1. Implement the mutation as a storage method + a **temporary token-guarded HTTP endpoint** (disabled entirely unless an env token like `ADMIN_MERGE_TOKEN` is set; constant-time token compare; make the logic **idempotent** so a re-run is a safe no-op).
2. Test end-to-end against the **dev** server (dev and prod data differ — mirror the prod scenario in dev first).
3. **Publish is required before the prod run**: the endpoint only exists in the deployed build after the user republishes. The agent cannot publish — must hand off to the user.
4. After publish, call the endpoint against the live domain (e.g. `https://meloan.ru/...`) with the token.
5. **Cleanup**: remove the endpoint + delete the token env var, then publish again.

**Why:** prod DB is not writable by the agent and its connection string is hidden; the app is the only actor that can mutate prod data.

**How to apply:** any request to fix/merge/backfill live data. Keep the endpoint temporary and idempotent; never leave an admin write endpoint in the shipped app long-term.
