/**
 * Manifest API Handler for Vercel
 * Serves the web app manifest with correct MIME type and headers
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set correct headers for manifest
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Path to manifest in production build
    const manifestPath = path.join(process.cwd(), 'dist', 'public', 'manifest.json');
    
    console.log('Serving manifest from:', manifestPath);
    console.log('Manifest exists:', fs.existsSync(manifestPath));
    
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      res.status(200).send(manifestContent);
    } else {
      console.error('Manifest file not found at:', manifestPath);
      res.status(404).json({ error: 'Manifest not found' });
    }
  } catch (error) {
    console.error('Error serving manifest:', error);
    res.status(500).json({ error: 'Error loading manifest' });
  }
}