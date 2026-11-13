module.exports = {
  apps: [{
    name: 'uez-api',
    cwd: __dirname,
    script: './dist/server/node-build.mjs',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      SITE_URL: 'https://uluslararasiekonomizirvesi.org'
    },
    env_production: {
      NODE_ENV: 'production', 
      PORT: 8080,
      SITE_URL: 'https://uluslararasiekonomizirvesi.org'
    },
    error_file: '../.pm2/logs/uez-api-error.log',
    out_file: '../.pm2/logs/uez-api-out.log',
    log_file: '../.pm2/logs/uez-api-combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}