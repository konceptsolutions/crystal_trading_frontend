module.exports = {
  apps: [
    {
      name: 'kso-backend',
      cwd: '/opt/kso/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/kso/backend-error.log',
      out_file: '/var/log/kso/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'kso-frontend',
      cwd: '/opt/kso/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/kso/frontend-error.log',
      out_file: '/var/log/kso/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};

