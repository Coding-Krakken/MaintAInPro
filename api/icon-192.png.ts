/**
 * Icon-192 API Handler for Vercel
 * Serves the 192x192 PWA icon with correct headers
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set correct headers for PNG icon
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Path to icon file (using generated-icon.png as the source)
    const iconPath = path.join(process.cwd(), 'generated-icon.png');
    
    console.log('Serving icon-192 from:', iconPath);
    console.log('Icon file exists:', fs.existsSync(iconPath));
    
    if (fs.existsSync(iconPath)) {
      const iconData = fs.readFileSync(iconPath);
      res.status(200).send(iconData);
    } else {
      console.error('Icon file not found at:', iconPath);
      res.status(404).json({ error: 'Icon not found' });
    }
  } catch (error) {
    console.error('Error serving icon-192:', error);
    res.status(500).json({ error: 'Error loading icon' });
  }
}