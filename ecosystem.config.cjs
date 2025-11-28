module.exports = {
  apps: [{
    name: 'ai-prompt-manager',
    script: './node_modules/vite/bin/vite.js',

    env: {
      PORT: 3010,
      NODE_ENV: 'development'
    },

    instances: 1,
    watch: false,
    max_memory_restart: '500M',
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',

    output: './logs/pm2-out.log',
    error: './logs/pm2-err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    exec_mode: 'fork',
    kill_timeout: 5000,
  }]
};
