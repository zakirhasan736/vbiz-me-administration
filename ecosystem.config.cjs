/**
 * PM2 process file for the Next.js administration app.
 * Always start from the `current` symlink — never from a release being built.
 *
 * Port 3009 matches nginx for app.vbizme.com (3000 is the public landing site).
 *
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --update-env
 */
module.exports = {
  apps: [
    {
      // Keep the historical PM2 name so deploy replaces the live process.
      name: 'vbizme-administration',
      cwd: '/var/www/vbiz-me-administration/current',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3009',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      kill_timeout: 8000,
      wait_ready: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3009,
      },
    },
  ],
}
