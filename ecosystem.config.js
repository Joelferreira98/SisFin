// Configuração do PM2 para ES6 modules
// Este arquivo usa CommonJS por compatibilidade com PM2
module.exports = {
  apps: [
    {
      name: "sisfin",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      },
      // Configurações de log
      log_file: "logs/combined.log",
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Configurações de reinicialização
      max_memory_restart: "1G",
      restart_delay: 4000,
      
      // Configurações de monitoramento
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      
      // Configurações de ambiente
      source_map_support: true,
      
      // Configurações de cluster
      merge_logs: true,
      
      // Configurações de kill
      kill_timeout: 5000
    }
  ]
};