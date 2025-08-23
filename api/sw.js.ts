/**
 * Service Worker API Handler for Vercel
 * Serves the service worker with correct MIME type and headers
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set correct headers for service worker
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Path to service worker in production build
    const swPath = path.join(process.cwd(), 'dist', 'public', 'sw.js');

    console.log('Serving service worker from:', swPath);
    console.log('Service worker exists:', fs.existsSync(swPath));

    if (fs.existsSync(swPath)) {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      res.status(200).send(swContent);
    } else {
      console.error('Service worker file not found at:', swPath);
      res.status(404).send('// Service worker not found');
    }
  } catch (error) {
    console.error('Error serving service worker:', error);
    res.status(500).send('// Error loading service worker');
  }
}
