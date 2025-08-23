/**
 * Example usage of enhanced security middleware
 * This file demonstrates how to integrate the new security features
 */

import express from 'express';
import { 
  enhancedSecurityStack, 
  rateLimiters, 
  initializeSecurity,
  getSecurityStats,
  unblockIP 
} from '../server/middleware/security.middleware';
import { 
  advancedSchemaValidation 
} from '../server/middleware/advanced-sanitization';
import { z } from 'zod';

const app = express();

// Initialize security system (Redis, etc.)
await initializeSecurity();

// Apply global security middleware
app.use(enhancedSecurityStack);

// Apply specific rate limiting to different route groups

// Auth routes with strict rate limiting
app.use('/api/auth', rateLimiters.auth);

// API routes with moderate rate limiting (skips admins)
app.use('/api', rateLimiters.api);

// Upload routes with restrictive rate limiting
app.use('/api/upload', rateLimiters.upload);

// Export routes with very restrictive rate limiting
app.use('/api/export', rateLimiters.export);

// Admin routes with moderate but tracked rate limiting
app.use('/api/admin', rateLimiters.admin);

// Example: Advanced schema validation on specific endpoints
const createUserSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    role: z.enum(['admin', 'manager', 'technician', 'contractor']),
  }),
};

app.post('/api/users', 
  advancedSchemaValidation(createUserSchema),
  (req, res) => {
    // Request body is now validated and sanitized
    res.json({ success: true, user: req.body });
  }
);

// Admin endpoint to check security statistics
app.get('/api/admin/security/stats', async (req, res) => {
  try {
    const stats = getSecurityStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch security stats',
      message: error.message 
    });
  }
});

// Admin endpoint to unblock an IP
app.post('/api/admin/security/unblock-ip', async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ 
        error: 'IP address is required' 
      });
    }
    
    const success = unblockIP(ip);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `IP ${ip} has been unblocked` 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to unblock IP address' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to unblock IP',
      message: error.message 
    });
  }
});

export default app;