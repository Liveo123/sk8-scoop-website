#!/usr/bin/env bash
# Resolve a Cloudflare preview for this exact GitHub PR commit. Fail closed:
# a live branch hostname alone is not evidence that its content is current.
set -euo pipefail
: "${GITHUB_REPOSITORY:?Missing repository}"
: "${PREVIEW_SHA:?Missing exact pull-request head SHA}"
: "${PREVIEW_REF:?Missing pull-request head branch}"
: "${GH_TOKEN:?Missing GitHub Actions token}"
slug="$(printf '%s' "$PREVIEW_REF" | sed 's#[^A-Za-z0-9-]#-#g')"
base="https://${slug}.previews.sk8scoop.com"
api="https://api.github.com/repos/${GITHUB_REPOSITORY}/commits/${PREVIEW_SHA}/check-runs?per_page=100"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
# Check GitHub's Cloudflare deployment check against the exact SHA, then
# compare actual served bytes with the checked-out revision. The PR-comment
# bot is not a prerequisite: it can be delayed, missing or refer to old SHA.
for attempt in $(seq 1 24); do
  checks="$(curl -fsSL --max-time 15 -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" "$api" 2>/dev/null || true)"
  state="$(printf '%s' "$checks" | jq -r '
    [.check_runs[]? | select(.name == "Workers Builds: sk8-scoop")] |
    if any(.[]; .conclusion == "success") then "success"
    elif any(.[]; .conclusion == "failure" or .conclusion == "cancelled") then "failed"
    else "pending" end' 2>/dev/null || echo "pending")"
  if [ "$state" = "failed" ]; then
    echo "Cloudflare build check failed for exact SHA ${PREVIEW_SHA:0:12}; refusing stale preview" >&2
    exit 1
  fi
  if [ "$state" = "success" ]; then
    parity=true
    # These assets cover the homepage, shared site behaviour, discovery,
    # sitewide styles, and changing events. A stale branch preview fails.
    for path in index.html assets/site.js assets/reader-first-home.js assets/sitewide-ux.css data/events.json; do
      if ! curl -fsSL --max-time 15 "$base/$path" -o "$tmp/served" 2>/dev/null ||
         ! cmp -s "$path" "$tmp/served"; then
        echo "Preview parity not current: $path (attempt $attempt/24)" >&2
        parity=false
        break
      fi
    done
    if [ "$parity" = true ]; then
      echo "Validated Cloudflare success for SHA ${PREVIEW_SHA:0:12} and five exact served files: $base" >&2
      printf '%s\n' "$base"
      exit 0
    fi
  else
    echo "Awaiting exact-SHA Cloudflare check ${PREVIEW_SHA:0:12} (attempt $attempt/24)" >&2
  fi
  sleep 10
done
echo "No exact-SHA Cloudflare build plus served-byte parity: ${PREVIEW_SHA}" >&2
exit 1
