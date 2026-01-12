module.exports = {
  apps: [
    {
      name: 'cbioagent',
      script: '.output/server/index.mjs',
      cwd: '/home/robot/projects/cbioagent',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        PORT: 3013,
        NODE_ENV: 'production',
      },
    },
  ],
}
