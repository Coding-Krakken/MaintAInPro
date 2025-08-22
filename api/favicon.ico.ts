/**
 * Favicon API Handler for Vercel
 * Serves the favicon.ico with correct headers
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set correct headers for ICO favicon
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Path to icon file (using generated-icon.png as the source - browsers accept PNG as favicon)
    const iconPath = path.join(process.cwd(), 'generated-icon.png');
    
    console.log('Serving favicon from:', iconPath);
    console.log('Icon file exists:', fs.existsSync(iconPath));
    
    if (fs.existsSync(iconPath)) {
      const iconData = fs.readFileSync(iconPath);
      res.status(200).send(iconData);
    } else {
      console.error('Favicon file not found at:', iconPath);
      res.status(404).json({ error: 'Favicon not found' });
    }
  } catch (error) {
    console.error('Error serving favicon:', error);
    res.status(500).json({ error: 'Error loading favicon' });
  }
}