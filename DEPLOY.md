# Zero-downtime deploy — Administration (frontend)

## Why production used to go down

Building with `yarn build` **inside the live app folder** replaces `.next` while `next start` is running. Visitors then hit a half-built app.

This pipeline **never builds in `current`**. It builds in `releases/<sha>/`, then flips a symlink and reloads PM2.

```
/var/www/vbiz-me-administration/
  current → releases/a1b2c3d/     ← what PM2 serves
  releases/
    a1b2c3d/                      ← live
    e4f5g6h/                      ← previous (instant rollback)
  shared/
    .env                          ← production secrets (not in git)
  ecosystem.config.cjs
```

## One-time server setup

```bash
sudo mkdir -p /var/www/vbiz-me-administration/{releases,shared}
sudo chown -R "$USER":"$USER" /var/www/vbiz-me-administration

# Put production env here (never commit it):
nano /var/www/vbiz-me-administration/shared/.env

# Install PM2 once:
npm i -g pm2
pm2 startup
```

Nginx should proxy `app.vbizme.com` → `http://127.0.0.1:3000`.

## GitHub secrets (repo → Settings → Secrets → Actions)

| Secret              | Example                           |
| ------------------- | --------------------------------- |
| `DEPLOY_HOST`       | `123.45.67.89` or hostname        |
| `DEPLOY_USER`       | `ubuntu`                          |
| `DEPLOY_SSH_KEY`    | private key for that user         |
| `DEPLOY_SSH_PORT`   | `22` (optional)                   |
| `DEPLOY_PATH_ADMIN` | `/var/www/vbiz-me-administration` |
| `ADMIN_HEALTH_URL`  | `https://app.vbizme.com/login`    |

Also create a GitHub **Environment** named `production` (optional approval gate).

## How deploys run

1. Push / merge to `main` → **CI** runs (lint, typecheck, test, build in GitHub — not on the live server).
2. When CI succeeds → **Deploy** workflow:
   - rsync code into `releases/<sha>/`
   - `yarn install` + `yarn build` **there**
   - `ln -sfn` → `current`
   - `pm2 reload` (keeps process manager; short graceful restart only)
   - health-check `/login`
3. Old releases kept for rollback.

Manual deploy: Actions → **Deploy** → Run workflow.

## Rollback (seconds)

```bash
cd /var/www/vbiz-me-administration
ls releases/
ln -sfn releases/<previous-sha> current
pm2 reload ecosystem.config.cjs --env production
```

## Local development

Keep using `yarn dev` on your laptop. **Do not** run `yarn build` on the production `current` directory.
