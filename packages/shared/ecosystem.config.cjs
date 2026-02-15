/**
 * pm2 ecosystem config for Ay Vitraya Agent.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart ay-vitraya
 *   pm2 logs ay-vitraya
 */
module.exports = {
    apps: [
        {
            name: 'ay-vitraya',
            script: 'npx',
            args: 'tsx src/index.ts',
            cwd: '/Users/uhthred/Downloads/Ai Vitraya/ay-vitraya-agent',
            env: {
                NODE_ENV: 'production',
            },
            // Restart policies
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 5000,

            // Logging
            error_file: '/Users/uhthred/Downloads/Ai Vitraya/ay-vitraya-agent/logs/error.log',
            out_file: '/Users/uhthred/Downloads/Ai Vitraya/ay-vitraya-agent/logs/out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Resource limits
            max_memory_restart: '512M',

            // Watch (disabled in prod — use git pull + pm2 restart instead)
            watch: false,
        },
    ],
};
