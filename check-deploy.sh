#!/usr/bin/env bash
#
# Deploy status checker for lisa-mizuno-portfolio
#   - GitHub Pages : via `gh` (uses your existing GitHub login)
#   - Vercel       : via Vercel REST API (needs VERCEL_TOKEN env var)
#
# Usage:
#   ./check-deploy.sh
#
# To enable the Vercel section, create a token once at
#   https://vercel.com/account/tokens
# then run with it, e.g.:
#   VERCEL_TOKEN=xxxxxxxx ./check-deploy.sh
#
set -euo pipefail

REPO="ops324/lisa-mizuno-portfolio"
cd "$(dirname "$0")"

SHA="$(git rev-parse HEAD)"
echo "HEAD commit: ${SHA:0:7}  ($(git log -1 --format=%s))"
echo

# ---------- GitHub Pages ----------
echo "== GitHub Pages =="
gh api "repos/$REPO/deployments?environment=github-pages&per_page=1" \
  --jq '.[0] | "  latest deploy commit: \(.sha[0:7])   at \(.created_at)"' 2>/dev/null || true
gh api "repos/$REPO/commits/$SHA/check-runs" \
  --jq '.check_runs[] | "  \(.name): \(.status) / \(.conclusion // "running")"' 2>/dev/null \
  || echo "  (no checks for this commit yet)"
echo "  URL: https://ops324.github.io/lisa-mizuno-portfolio/"
echo

# ---------- Vercel ----------
echo "== Vercel =="
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "  VERCEL_TOKEN not set — Vercel status skipped."
  echo "  Enable it with:"
  echo "    1) Create a token: https://vercel.com/account/tokens"
  echo "    2) VERCEL_TOKEN=xxxx ./check-deploy.sh"
elif [ ! -f .vercel/project.json ]; then
  echo "  .vercel/project.json not found (run \`npx vercel link\` once)."
else
  PID=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])")
  ORG=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['orgId'])")
  curl -s "https://api.vercel.com/v6/deployments?projectId=$PID&teamId=$ORG&limit=3" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c '
import sys, json, datetime
data = json.load(sys.stdin)
if "error" in data:
    print("  API error:", data["error"].get("message", data["error"]))
    sys.exit()
deps = data.get("deployments", [])
if not deps:
    print("  no deployments found (check token / team access)")
else:
    for x in deps:
        meta = x.get("meta") or {}
        sha = (meta.get("githubCommitSha") or "")[:7]
        state = x.get("readyState") or x.get("state") or "?"
        url = x.get("url") or ""
        ts = x.get("created")
        when = datetime.datetime.utcfromtimestamp(ts/1000).strftime("%Y-%m-%d %H:%M") if ts else ""
        print("  " + state.ljust(9) + " " + (sha or "-") + "  " + when + "  https://" + url)
'
fi
