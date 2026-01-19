module.exports = {
  apps: [
    {
      name: "it-assets-manager",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1, // Use 1 instance to avoid session sharing issues, or use "max" with Redis session store
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Force trust proxy for cookie handling
        TRUST_PROXY: "true",
        // Set basePath if deploying to subdirectory
        NEXT_PUBLIC_BASE_PATH: "/it-assets-manager",
      },
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Auto-restart configuration
      watch: false,
      max_memory_restart: "1G",
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
