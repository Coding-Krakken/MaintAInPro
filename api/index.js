// Vercel API route - Main API handler
export default function handler(req, res) {
  const { method, url } = req;
  
  // Simple API router for Vercel
  if (url.includes('/api/health')) {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'MaintAInPro CMMS'
    });
  }
  
  // Default response for other API routes
  res.status(200).json({
    message: 'MaintAInPro CMMS API',
    method,
    path: url,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
