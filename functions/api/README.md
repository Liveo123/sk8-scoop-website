# API compatibility directory

`worker.js` is the production runtime authority for `/api/*` because `wrangler.toml` routes API requests through the Worker first.

The handlers in this directory are retained only as compatibility copies for alternate Pages-style execution and should not be treated as an independent source of truth.

## Rules

- Change production API behaviour in `worker.js` first.
- Keep any retained compatibility handler aligned with the Worker contract.
- Do not add a new duplicate handler unless an actual deployment path requires it.
- Prefer deterministic parity checks for shared validation values and routes.
- If the Pages compatibility path is permanently retired, remove these copies in one deliberate architecture change rather than allowing silent drift.

The post-launch release preflight checks the current advertiser TEST/GROW package values in both implementations.
