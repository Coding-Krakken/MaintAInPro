// Vercel API route - Health endpoint
export default function handler(req, res) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    build: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      deployment: process.env.VERCEL_URL || 'local'
    }
  };

  res.status(200).json(healthData);
}
