#!/usr/bin/env bash
# Runs ON the production server. Builds a release folder, flips `current`, reloads PM2.
# Live site keeps serving the previous release until the flip.
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH required}"
RELEASE_SHA="${RELEASE_SHA:?RELEASE_SHA required}"
HEALTH_URL="${HEALTH_URL:-https://app.vbizme.com/login}"
RELEASE_DIR="${DEPLOY_PATH}/releases/${RELEASE_SHA}"
SHARED_ENV="${DEPLOY_PATH}/shared/.env"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

cd "$RELEASE_DIR"

if [[ ! -f "$SHARED_ENV" ]]; then
  echo "ERROR: missing ${SHARED_ENV}"
  echo "Create production env once:  nano ${SHARED_ENV}"
  exit 1
fi

ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env"

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
corepack enable
corepack prepare yarn@4.17.1 --activate

echo "==> Installing dependencies in release ${RELEASE_SHA} (live site untouched)"
yarn install --immutable

echo "==> Building Next.js in release ${RELEASE_SHA} (live site untouched)"
# shellcheck disable=SC1091
set -a
source "$SHARED_ENV"
set +a
yarn build

echo "==> Atomic symlink flip â†’ current"
ln -sfn "$RELEASE_DIR" "${DEPLOY_PATH}/current"

# Keep a copy of ecosystem next to the app root for PM2.
cp -f "${RELEASE_DIR}/ecosystem.config.cjs" "${DEPLOY_PATH}/ecosystem.config.cjs"

echo "==> PM2 reload (graceful â€” no full downtime window for in-place rebuild)"
cd "$DEPLOY_PATH"
if pm2 describe vbiz-admin >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env --env production
else
  pm2 start ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Health check ${HEALTH_URL}"
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS -o /dev/null -w "%{http_code}" "$HEALTH_URL" | grep -Eq '^(200|301|302|308)$'; then
    ok=1
    break
  fi
  sleep 3
done

if [[ "$ok" -ne 1 ]]; then
  echo "ERROR: health check failed after deploy"
  echo "Previous releases still under ${DEPLOY_PATH}/releases/ â€” roll back with:"
  echo "  ln -sfn ${DEPLOY_PATH}/releases/<previous-sha> ${DEPLOY_PATH}/current && pm2 reload ecosystem.config.cjs --env production"
  exit 1
fi

echo "==> Pruning old releases (keep ${KEEP_RELEASES})"
cd "${DEPLOY_PATH}/releases"
ls -1dt */ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> Deploy complete: ${RELEASE_SHA}"
