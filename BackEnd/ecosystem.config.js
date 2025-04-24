module.exports = {
    apps: [{
      name: "your-app-name",
      script: "server.js",  // your main server file
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      }
    }]
  };